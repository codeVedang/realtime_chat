import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import OnlineUsersList from "./OnlineUsersList";
import TypingIndicator from "./TypingIndicator";

const BASE = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export default function ChatRoom({ username, room, token: _token, onSwitchRoom }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");

  // ---- Fetch rooms from server ----
  useEffect(() => {
    fetch(`${BASE}/rooms`)
      .then(r => r.json())
      .then(setRooms);

    socket.on("roomsUpdated", setRooms);
    return () => socket.off("roomsUpdated", setRooms);
  }, []);

  // ---- Socket listeners ----
  useEffect(() => {
    function onChatMessage(msg) {
      if (!msg || !msg.text || !msg.username) return;
      setMessages(prev => [...prev, msg]);
    }
    function onOnlineUsers(list) {
      setOnlineUsers(Array.isArray(list) ? list : []);
    }
    function onTyping({ username: u, isTyping }) {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(u); else next.delete(u);
        return next;
      });
    }

    socket.on("chatMessage", onChatMessage);
    socket.on("onlineUsers", onOnlineUsers);
    socket.on("typing", onTyping);

    return () => {
      socket.off("chatMessage", onChatMessage);
      socket.off("onlineUsers", onOnlineUsers);
      socket.off("typing", onTyping);
    };
  }, []);

  const typingText = useMemo(() => {
    const arr = Array.from(typingUsers).filter(u => u !== username);
    if (!arr.length) return "";
    if (arr.length === 1) return `${arr[0]} is typing...`;
    return `${arr.slice(0, 2).join(", ")}${arr.length > 2 ? " +" + (arr.length - 2) : ""} are typing...`;
  }, [typingUsers, username]);

  // ---- Create new room ----
  async function createRoom() {
    if (!newRoom.trim()) return;
    await fetch(`${BASE}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoom.trim() })
    });
    setNewRoom("");
  }

  return (
    <>
      <div className="sidebar">
        <h3>Rooms</h3>
        <div className="rooms">
          {rooms.map(r => (
            <button
              key={r}
              className={`room-btn ${r === room ? "active" : ""}`}
              onClick={() => onSwitchRoom(r)}
            >
              #{r}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <input
            className="input"
            placeholder="New room name"
            value={newRoom}
            onChange={e => setNewRoom(e.target.value)}
          />
          <button className="btn primary" onClick={createRoom}>
            Create
          </button>
        </div>

        <h3 style={{ marginTop: 16 }}>Online</h3>
        <OnlineUsersList users={onlineUsers} />
      </div>

      <div className="content">
        <div className="header">
          <div className="room-title">Room: #{room}</div>
          <div className="small">You are: {username}</div>
        </div>

        <MessageList messages={messages} me={username} />
        <TypingIndicator text={typingText} />
        <div className="footer">
          <MessageInput
            onTyping={(is) => socket.emit("typing", { isTyping: is })}
            onSend={(text) => socket.emit("chatMessage", { text, room, username })}
          />
        </div>
      </div>
    </>
  );
}
