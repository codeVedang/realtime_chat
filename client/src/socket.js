import { io } from 'socket.io-client';
const URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

// Pass token later when you call socket.connect()
export const socket = io(URL, { autoConnect: false });
export function connectWithToken(token) {
  socket.auth = { token };
  socket.connect();
}
