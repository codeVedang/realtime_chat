import React, { useEffect, useRef, useState } from "react";
import { socket, connectWithToken } from "./socket";
import ChatRoom from "./components/ChatRoom";
import LoginForm from "./components/LoginForm";
import "./App.css";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [room, setRoom] = useState(localStorage.getItem("room") || "general");
  const connectedOnce = useRef(false);

  function onAuth(tok, usr) {
    setToken(tok);
    setUser(usr);
    localStorage.setItem("token", tok);
    localStorage.setItem("user", JSON.stringify(usr));
  }

  function logout() {
    socket.disconnect();
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  useEffect(() => {
    if (!token || !user) return;

    connectWithToken(token);

    const onConnect = () => {
      socket.emit("joinRoom", { room });
      connectedOnce.current = true;
    };
    const onReconnect = () => socket.emit("joinRoom", { room });

    socket.on("connect", onConnect);
    socket.io.on("reconnect", onReconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.io.off("reconnect", onReconnect);
    };
  }, [token, user, room]);

  useEffect(() => {
    localStorage.setItem("room", room);
  }, [room]);

  if (!token || !user) return <LoginForm onAuth={onAuth} />;

  return (
    <div className="app">
      {/* Optional top bar */}
      {/* <div className="topbar">
        <span>Signed in as {user.username}</span>
        <button className="btn" onClick={logout}>Logout</button>
      </div> */}

      <ChatRoom
        username={user.username}
        room={room}
        token={token}
        onSwitchRoom={(r) => {
          if (r === room) return;
          setRoom(r);
          socket.emit("joinRoom", { room: r });
        }}
      />
    </div>
  );
}
