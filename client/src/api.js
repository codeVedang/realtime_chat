const BASE = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
console.log('SERVER URL fetch ->', BASE); // <-- TEMP debug line

// api.js
export async function fetchHistory(room, limit = 50, token) {
  const res = await fetch(`${BASE}/rooms/${encodeURIComponent(room)}/messages?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}


export async function registerUser(username, password, email) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data; // { token, user }
}

export async function loginUser(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data; // { token, user }
}

export async function getMe(token) {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Not authenticated');
  return data; // { user }
}
