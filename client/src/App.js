// client/src/App.js
import React, { useEffect, useState } from "react";
import { socket, connectWithToken } from "./socket";
import ChatRoom from "./components/ChatRoom";
import "./App.css"; // make sure this is imported

const BASE = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

async function loginUser(username, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Login failed");
  return data; // { token, user }
}

async function registerUser(username, password, email) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Registration failed");
  return data;
}

function Login({ onAuth }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await loginUser(username, password)
          : await registerUser(username, password, email || undefined);
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
          <p className="muted">
            {mode === "login"
              ? "Sign in to continue"
              : "Join and start chatting instantly"}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && (
            <div className="form-field">
              <label>Email (optional)</label>
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-field">
            <label>Username</label>
            <input
              className="auth-input"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {err && <div className="auth-error">{err}</div>}

          <button className="auth-btn primary" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Login" : "Create Account"}
          </button>

          <button
            className="auth-btn ghost"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [room, setRoom] = useState("general");

  function onAuth(tok, usr) {
    setToken(tok);
    setUser(usr);
    localStorage.setItem("token", tok);
    localStorage.setItem("user", JSON.stringify(usr));
  }

  useEffect(() => {
    if (!token || !user) return;
    connectWithToken(token); // sets socket.auth + connects
    socket.on("connect", () => socket.emit("joinRoom", { room }));
    return () => {
      socket.off("connect");
      socket.disconnect();
    };
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
