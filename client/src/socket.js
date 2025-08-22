import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
console.log('SERVER URL socket.io ->', URL); // <-- TEMP debug line; check in browser console

export const socket = io(URL, { autoConnect: false });

export function connectWithToken(token) {
  socket.auth = { token };
  socket.connect();
}
