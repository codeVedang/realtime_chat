import React, { useState } from "react";
import { loginUser, registerUser } from "../api"; // see api.js below

export default function LoginForm({ onAuth }) {
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
          ? await loginUser(username.trim(), password)
          : await registerUser(username.trim(), password, email || undefined);
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
            {mode === "login" ? "Sign in to continue" : "Join and start chatting instantly"}
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
