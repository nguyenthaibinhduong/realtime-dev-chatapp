import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

type SocketTransport = "polling" | "websocket" | "webtransport";

const validTransports = new Set<SocketTransport>([
  "polling",
  "websocket",
  "webtransport",
]);

const getSocketTransports = (): SocketTransport[] => {
  const transports = import.meta.env.VITE_SOCKET_TRANSPORTS;

  if (!transports) {
    return import.meta.env.PROD ? ["polling"] : ["websocket", "polling"];
  }

  const parsedTransports = transports
    .split(",")
    .map((transport: string) => transport.trim().toLowerCase())
    .filter((transport: string): transport is SocketTransport =>
      validTransports.has(transport as SocketTransport)
    );

  return parsedTransports.length > 0 ? parsedTransports : ["polling"];
};

export function getSocket(token?: string, forceNew = false): Socket {
  if (!socket || forceNew) {
    if (socket) {
      socket.disconnect();
    }

    const authToken = token || localStorage.getItem("token") || "";

    // socket = io(import.meta.env.VITE_SOCKET_URL || "/", {
    //   autoConnect: false,
    //   path: import.meta.env.VITE_SOCKET_PATH || "/socket.io",
    //   transports: getSocketTransports(),
    //   withCredentials: true,
    //   auth: {
    //     token: authToken,
    //   },
    //   query: {
    //     token: authToken,
    //   },
    //   reconnection: true,
    //   reconnectionAttempts: 10,
    //   reconnectionDelay: 1000,
    // });
    const url = "http://180.93.43.146:3088";

    socket = io(url || "/", {
    // Không set path → socket.io-client dùng mặc định "/socket.io", khớp với BE.
    auth: { token: authToken },
    // BE bật Access-Control-Allow-Credentials: true, cần bật cùng phía client.
    withCredentials: true,
    // Chỉ sử dụng websocket để tối ưu hiệu năng và tránh HTTP long-polling liên tục.
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })

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
