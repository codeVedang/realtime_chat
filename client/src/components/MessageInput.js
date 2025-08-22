import React, { useEffect, useState } from 'react';

export default function MessageInput({ onSend, onTyping }) {
  const [text, setText] = useState('');

  useEffect(() => {
    if (!onTyping) return;
    onTyping(true);
    const t = setTimeout(() => onTyping(false), 800);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  function submit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <form onSubmit={submit} className="row">
      <input
        className="input"
        placeholder="Type a message"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button className="btn primary" type="submit">Send</button>
    </form>
  );
}
