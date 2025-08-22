import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function Login({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail]       = useState('');
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setErr('');
    try {
      const data = mode === 'login'
        ? await loginUser(username, password)
        : await registerUser(username, password, email || undefined);

      onAuth(data.token, data.user); // parent stores token/user
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div className="sidebar" style={{ width: '100%' }}>
      <h2>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={submit} className="row" style={{ flexDirection: 'column', gap: 12 }}>
        {mode === 'register' && (
          <input className="input" placeholder="Email (optional)" value={email} onChange={e => setEmail(e.target.value)} />
        )}
        <input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn primary" type="submit">{mode === 'login' ? 'Login' : 'Create Account'}</button>
      </form>
      {err && <p className="small" style={{ color: 'crimson', marginTop: 8 }}>{err}</p>}
      <p className="small" style={{ marginTop: 12 }}>
        {mode === 'login' ? 'No account?' : 'Have an account?'}{' '}
        <button className="btn" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}
