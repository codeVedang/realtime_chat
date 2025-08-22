import React, { useEffect, useRef } from 'react';

export default function MessageList({ messages, me }) {
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="messages" ref={ref}>
      {messages.map(m => (
        <div
          key={m._id || (m.createdAt + m.username + m.text)}
          className={`msg ${m.username === me ? 'me' : ''}`}
        >
          <div className="username">
            {m.username} • {new Date(m.createdAt || Date.now()).toLocaleTimeString()}
          </div>
          <div>{m.text}</div>
        </div>
      ))}
    </div>
  );
}
