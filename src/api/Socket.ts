import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketTransports = () => {
  const transports = import.meta.env.VITE_SOCKET_TRANSPORTS;

  if (!transports) return ["websocket", "polling"];

  return transports
    .split(",")
    .map((transport: string) => transport.trim())
    .filter(Boolean);
};

export function getSocket(token?: string, forceNew = false): Socket {
  if (!socket || forceNew) {
    if (socket) {
      socket.disconnect();
    }

    const authToken = token || localStorage.getItem("token") || "";

    socket = io(import.meta.env.VITE_SOCKET_URL || "/", {
      autoConnect: false,
      path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
      transports: getSocketTransports(),
      withCredentials: true,
      auth: {
        token: authToken,
      },
      query: {
        token: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connect error:", error.message, error);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
  }

  return socket;
}
