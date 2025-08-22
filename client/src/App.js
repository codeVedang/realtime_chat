import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import ChatRoom from "./components/ChatRoom";

const SERVER_URL = "https://realtime-chat-6n47.onrender.com"; // your backend

function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ username: "Vedang" });
  const [room, setRoom] = useState("general");
  const [token, setToken] = useState(""); // if using JWT

  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      setConnected(true);
      setLoading(false);
    });

    newSocket.on("connect_error", () => {
      console.log("⚠️ Connection failed, retrying...");
      setConnected(false);
      setLoading(true);
    });

    return () => newSocket.close();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "100vh", 
        fontSize: "20px", 
        fontWeight: "bold" 
      }}>
        ⏳ Please wait, connecting to Render backend...
      </div>
    );
  }

  return (
    <div className="app">
      <ChatRoom
        username={user.username}
        room={room}
        token={token}
        onSwitchRoom={(r) => {
          setRoom(r);
          socket.emit("joinRoom", { room: r });
        }}
      />
    </div>
  );
}

export default App;
