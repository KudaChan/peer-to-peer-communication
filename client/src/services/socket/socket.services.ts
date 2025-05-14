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
    transports: ['websocket', 'polling'], // Try both transport methods
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  }
);

socket.on("connect", () => {
  console.log("Socket connected: ", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});
