import io, { Socket } from "socket.io-client";
import { store } from "@/redux/store";

interface ISocketInstance extends Socket {
  callId?: string;
}

// Create socket instance:
export const socket: ISocketInstance = io(
  process.env.NEXT_PUBLIC_SOCKET_URL as string,
  {
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
  }
);

socket.on("connect", () => {
  console.log("Socket connected: ", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
  console.error("Socket connection error message:", error.message);
  console.error("Socket URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
