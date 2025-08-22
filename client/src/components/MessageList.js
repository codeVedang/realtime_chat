import React, { useEffect, useRef } from 'react';

export default function MessageList({ messages, me }) {
  const ref = useRef(null);

  // Filter out malformed/empty messages to avoid blank bubbles
  const clean = (Array.isArray(messages) ? messages : []).filter(
    m => m && m.text && m.username
  );

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [clean]);

  return (
    <div className="messages" ref={ref}>
      {clean.map(m => {
        const time = new Date(m.createdAt || Date.now()).toLocaleTimeString();
        return (
          <div
            key={m._id || `${m.username}-${m.createdAt}-${m.text}`}
            className={`msg ${m.username === me ? 'me' : ''}`}
          >
            <div className="username">
              {m.username} • {time}
            </div>
            <div>{m.text}</div>
          </div>
        );
      })}
    </div>
  );
}
