// client/src/App.js
import React, { useEffect, useState } from "react";
import { socket, connectWithToken } from "./socket";
import ChatRoom from "./components/ChatRoom";

// ---- simple login/register API ----
const BASE = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
async function loginUser(username, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}
async function registerUser(username, password, email) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Registration failed");
  return data;
}

function Login({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = mode === "login"
        ? await loginUser(username, password)
        : await registerUser(username, password, email || undefined);
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="app" style={{display:"grid",placeItems:"center",height:"100vh"}}>
      <form onSubmit={submit} style={{display:"grid",gap:10,width:320}}>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>
        {mode === "register" && (
          <input placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
        )}
        <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">{mode === "login" ? "Login" : "Create account"}</button>
        {err && <div style={{color:"crimson"}}>{err}</div>}
        <button type="button" onClick={()=>setMode(mode==="login"?"register":"login")} style={{marginTop:8}}>
          {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null;
  });
  const [room, setRoom] = useState("general");

  function onAuth(tok, usr) {
    setToken(tok); setUser(usr);
    localStorage.setItem("token", tok);
    localStorage.setItem("user", JSON.stringify(usr));
  }

  useEffect(() => {
    if (!token || !user) return;
    connectWithToken(token);                // socket.auth = { token }; socket.connect()
    socket.on("connect", () => socket.emit("joinRoom", { room }));
    return () => { socket.off("connect"); socket.disconnect(); };
  }, [token, user, room]);

  if (!token || !user) return <Login onAuth={onAuth} />;

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
