import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "https://stage-timer.178-156-222-232.sslip.io";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on("connect", () => {
      console.log("[Socket] Conectado ao servidor:", SOCKET_URL);
    });

    socketInstance.on("disconnect", (reason) => {
      console.warn("[Socket] Desconectado:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket] Erro de conexão:", error.message);
    });
  }

  return socketInstance;
}
