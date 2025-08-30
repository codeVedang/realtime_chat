import React, { useEffect, useMemo, useState } from "react";
import { socket } from "../socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import OnlineUsersList from "./OnlineUsersList";
import TypingIndicator from "./TypingIndicator";

export default function ChatRoom({ username, room, token, onSwitchRoom }) {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Fetch rooms + update when server broadcasts new ones
  useEffect(() => {
    fetch(`${process.env.REACT_APP_SERVER_URL}/rooms`)
      .then(r => r.json())
      .then(setRooms);

    socket.on("roomsUpdated", setRooms);
    return () => socket.off("roomsUpdated", setRooms);
  }, []);

  // Socket listeners for chat, online users, typing
  useEffect(() => {
    socket.on("chatHistory", setMessages);
    socket.on("chatMessage", (msg) => setMessages(prev => [...prev, msg]));
    socket.on("onlineUsers", setOnlineUsers);
    socket.on("typing", ({ username: u, isTyping }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (isTyping) next.add(u);
        else next.delete(u);
        return next;
      });
    });

    return () => {
      socket.off("chatHistory");
      socket.off("chatMessage");
      socket.off("onlineUsers");
      socket.off("typing");
    };
  }, []);

  // Typing text display
  const typingText = useMemo(() => {
    const arr = Array.from(typingUsers).filter(u => u !== username);
    if (!arr.length) return "";
    if (arr.length === 1) return `${arr[0]} is typing...`;
    return `${arr.slice(0, 2).join(", ")}${arr.length > 2 ? " +" + (arr.length - 2) : ""} are typing...`;
  }, [typingUsers, username]);

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
            placeholder="New room name"
            value={newRoom}
            onChange={e => setNewRoom(e.target.value)}
            className="input"
          />
          <button
            className="btn primary"
            onClick={async () => {
              if (!newRoom.trim()) return;
              await fetch(`${process.env.REACT_APP_SERVER_URL}/rooms`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoom })
              });
              setNewRoom("");
            }}
          >
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
            onTyping={(is) => socket.emit("typing", { room, username, isTyping: is })}
            onSend={(text) => socket.emit("chatMessage", { room, username, text })}
          />
        </div>
      </div>
    </>
  );
}
