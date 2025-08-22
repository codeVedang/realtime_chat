import React, { useEffect, useMemo, useState } from 'react';
import { socket } from '../socket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsersList from './OnlineUsersList';
import TypingIndicator from './TypingIndicator';

const rooms = ['general', 'random', 'tech', 'music'];

export default function ChatRoom({ username, room, token: _token, onSwitchRoom }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Socket listeners: history, live messages, online, typing
  useEffect(() => {
    function onChatHistory(history) {
      // Replace with clean history sent by server
      setMessages(Array.isArray(history) ? history : []);
    }
    function onChatMessage(msg) {
      // Ignore malformed messages
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

    socket.on('chatHistory', onChatHistory);
    socket.on('chatMessage', onChatMessage);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('typing', onTyping);

    return () => {
      socket.off('chatHistory', onChatHistory);
      socket.off('chatMessage', onChatMessage);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('typing', onTyping);
    };
  }, []);

  // NOTE: We removed REST fetchHistory to avoid duplicates/blank bubbles.
  // Server already emits 'chatHistory' right after joinRoom.

  const typingText = useMemo(() => {
    const arr = Array.from(typingUsers).filter(u => u !== username);
    if (!arr.length) return '';
    if (arr.length === 1) return `${arr[0]} is typing...`;
    return `${arr.slice(0, 2).join(', ')}${arr.length > 2 ? ' +' + (arr.length - 2) : ''} are typing...`;
  }, [typingUsers, username]);

  return (
    <>
      <div className="sidebar">
        <h3>Rooms</h3>
        <div className="rooms">
          {rooms.map(r => (
            <button
              key={r}
              className={`room-btn ${r === room ? 'active' : ''}`}
              onClick={() => onSwitchRoom(r)}
            >
              #{r}
            </button>
          ))}
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
            onTyping={(is) => socket.emit('typing', { isTyping: is })}
            onSend={(text) => socket.emit('chatMessage', { text })}
          />
        </div>
      </div>
    </>
  );
}
