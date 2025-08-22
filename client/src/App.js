import React, { useEffect, useState } from "react";
import { socket, connectWithToken } from "./socket";
import ChatRoom from "./components/ChatRoom";

// Use your env variable; fallback only for local dev
const SERVER_URL =
  process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

// --- helper: ask backend for a guest token ---
async function getGuestToken(username) {
  const res = await fetch(`${SERVER_URL}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `guest failed (${res.status})`);
  }
  return data; // { token, user: { id, username } }
}

export default function App() {
  const [loading, setLoading] = useState(true);     // show “please wait…”
  const [connected, setConnected] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState("general");

  // 1) Get a guest token, then 2) connect socket with token
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // pick a simple default username (you can replace with a form)
        const defaultName =
          "guest-" + Math.floor(1000 + Math.random() * 9000);
        const { token: tkn, user: usr } = await getGuestToken(defaultName);
        if (cancelled) return;

        setToken(tkn);
        setUser(usr);

        // connect socket with auth token & listen for connect/error
        connectWithToken(tkn);

        socket.on("connect", () => {
          setConnected(true);
          setLoading(false);
          // join the default room on connect
          socket.emit("joinRoom", { room });
        });

        socket.on("connect_error", (err) => {
          console.log("connect_error:", err?.message || err);
          setConnected(false);
          setLoading(true);
        });
      } catch (e) {
        console.error("Guest token error:", e);
        setLoading(true);
      }
    })();

    return () => {
      cancelled = true;
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [room]);

  if (loading || !user) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        ⏳ Please wait, connecting to Render backend…
      </div>
    );
  }

  return (
    <div className="app">
      <ChatRoom
        username={user.username}
        room={room}
        token={token} // (not used in socket-only history, but fine to pass)
        onSwitchRoom={(r) => {
          setRoom(r);
          if (connected) socket.emit("joinRoom", { room: r });
        }}
      />
    </div>
  );
}
