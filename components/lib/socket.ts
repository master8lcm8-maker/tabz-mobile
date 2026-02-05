/* components/lib/socket.ts */
import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";
import { getBaseUrl } from "./api";

/**
 * Normalize BASE_URL into a Socket.IO-safe origin.
 * Examples:
 * - https://example.com/api -> https://example.com
 * - http://example.com:3000 -> http://example.com:3000
 * - example.com:3000       -> scheme inferred (web=https, native=http)
 */
function normalizeSocketOrigin(baseUrl: string): string {
  const raw = String(baseUrl || "").trim();
  if (!raw) {
    throw new Error("SOCKET_BASE_URL_EMPTY");
  }

  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    // handle host:port without scheme
    const cleaned = raw.replace(/\/+$/, "");
    if (/^https?:\/\//i.test(cleaned)) return cleaned;

    const scheme = Platform.OS === "web" ? "https://" : "http://";
    return scheme + cleaned;
  }
}

// Singleton socket instance
let socket: Socket | null = null;
let lastOrigin: string | null = null;

/**
 * Canonical socket accessor.
 * Always aligned with the API base URL.
 */
export function getSocket(): Socket {
  const baseUrl = getBaseUrl();
  const origin = normalizeSocketOrigin(baseUrl);

  // Reuse socket if origin has not changed
  if (socket && lastOrigin === origin) {
    return socket;
  }

  // Tear down previous socket if base URL changed
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch {}
    socket = null;
    lastOrigin = null;
  }

  lastOrigin = origin;

  socket = io(origin, {
    transports: ["websocket", "polling"],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  return socket;
}

/**
 * Default export for legacy imports.
 * NOTE: If this throws during early boot, switch callers to getSocket()
 * after hydrateSession().
 */
const defaultSocket = (() => {
  try {
    return getSocket();
  } catch {
    // Fail fast instead of silently connecting to the wrong backend
    return null as any;
  }
})();

export default defaultSocket;
