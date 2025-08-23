// client/src/App.js
import React, { useEffect, useRef, useState } from "react";
import { socket, connectWithToken } from "./socket";
import ChatRoom from "./components/ChatRoom";
import { loginUser, registerUser } from "./api"; // <-- make sure api.js exists
import "./App.css"; // or "./App.css" depending on where your CSS is

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [room, setRoom] = useState(localStorage.getItem("room") || "general");
  const connectedOnce = useRef(false);

  // 🔹 Login/Register state
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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

  // 🔹 Handle socket connections
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

  // 🔹 Handle login/register submit
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await loginUser(username.trim(), password)
          : await registerUser(username.trim(), password, email || undefined);
      onAuth(res.token, res.user);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 If no token/user → show login/register form
  if (!token || !user) {
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

  // 🔹 Authenticated → show chat room
  return (
    <div className="app">
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
