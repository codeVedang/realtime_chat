import React, { useState } from 'react';


const defaultRooms = ['general', 'random', 'tech', 'music'];


export default function JoinForm({ onJoin }) {
const [username, setUsername] = useState('');
const [room, setRoom] = useState(defaultRooms[0]);


return (
<div className="sidebar" style={{ width: '100%' }}>
<h2>Join Chat</h2>
<div className="row" style={{ marginTop: 12 }}>
<input className="input" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
</div>
<div className="row" style={{ marginTop: 12 }}>
<select className="input" value={room} onChange={e => setRoom(e.target.value)}>
{defaultRooms.map(r => <option key={r} value={r}>{r}</option>)}
</select>
</div>
<div className="row" style={{ marginTop: 12 }}>
<button className="btn primary" onClick={() => username.trim() && onJoin(username.trim(), room)}>Join</button>
</div>
<p className="small" style={{ marginTop: 12 }}>No sign-in. Guest mode for speed.</p>
</div>
);
}