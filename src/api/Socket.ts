import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token?: string, forceNew = false): Socket {
  if (!socket || forceNew) {
    if (socket) {
      socket.disconnect();
    }

    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3088", {
      autoConnect: false, // 👈 chỉ connect khi gọi .connect()
      extraHeaders: {
        Authorization: `Bearer ${token || localStorage.getItem("token") || ""}`,
      },
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });
  }
  return socket;
}
