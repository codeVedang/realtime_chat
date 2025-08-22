import React, { useEffect, useState } from 'react';
import { socket, connectWithToken } from './socket';
import { fetchHistory } from './api';
import Login from './components/Login';
import ChatRoom from './components/ChatRoom';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [room, setRoom] = useState('general');

  function handleAuth(tok, usr) {
    setToken(tok);
    setUser(usr);
    localStorage.setItem('token', tok);
    localStorage.setItem('user', JSON.stringify(usr));
  }

  // Connect socket once authenticated
  useEffect(() => {
    if (!token || !user) return;
    connectWithToken(token);                          // sets socket.auth & connects
    socket.emit('joinRoom', { room });                // username comes from token server-side
    return () => socket.disconnect();
  }, [token, user]);

  if (!token || !user) return <div className="app"><Login onAuth={handleAuth} /></div>;

  return (
    <div className="app">
      <ChatRoom
        username={user.username}
        room={room}
        onSwitchRoom={(r) => {
          setRoom(r);
          socket.emit('joinRoom', { room: r });
        }}
      />
    </div>
  );
}
