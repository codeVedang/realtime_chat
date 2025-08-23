// client/src/api.js
const BASE =
  (process.env.REACT_APP_SERVER_URL || "").trim() ||
  "http://localhost:5000";

async function apiJSON(path, body) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    return data;
  } catch (e) {
    if (e?.message === "Failed to fetch" || e?.name === "TypeError") {
      throw new Error("Unable to reach server. Please try again.");
    }
    throw e;
  }
}

export const loginUser = (username, password) =>
  apiJSON("/auth/login", { username, password });

export const registerUser = (username, password, email) =>
  apiJSON("/auth/register", { username, password, email });
