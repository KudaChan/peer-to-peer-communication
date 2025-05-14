import io, { Socket } from "socket.io-client";
import { store } from "@/redux/store";

interface ISocketInstance extends Socket {
  callId?: string;
}

// Get socket URL from environment with fallback
const getSocketUrl = () => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
  console.log('Using socket URL:', url);
  return url;
};

// Create socket instance:
export const socket: ISocketInstance = io(getSocketUrl(), {
  auth: {
    token: store.getState().user.token,
  },
  withCredentials: true,
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io'
});

socket.on("connect", () => {
  console.log("Socket connected: ", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

// Update socket auth function to handle token properly
export const updateSocketAuth = () => {
  const token = store.getState().user.token;
  if (token && socket) {
    console.log("Updating socket auth token:", token.substring(0, 10) + "...");
    socket.auth = { token };
    socket.disconnect().connect();
  }
};

// Add a function to initialize socket with current token
export const initializeSocket = () => {
  const token = store.getState().user.token;
  if (token) {
    console.log("Initializing socket with token:", token.substring(0, 10) + "...");
    socket.auth = { token };
    socket.connect();
  }
};
