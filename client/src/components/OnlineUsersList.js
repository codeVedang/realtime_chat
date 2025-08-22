import React from 'react';

export default function OnlineUsersList({ users }) {
  return (
    <ul className="online-list">
      {users.map(u => <li key={u}>🟢 {u}</li>)}
    </ul>
  );
}
