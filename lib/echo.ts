import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getStoredToken } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
// POST /broadcasting/auth is registered at the app root (bootstrap/app.php's
// withBroadcasting()), not under /api like every other endpoint.
const BROADCASTING_AUTH_URL = API_URL.replace(/\/api\/?$/, "") + "/broadcasting/auth";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echoInstance: Echo<"reverb"> | null = null;

/**
 * FR-D-030..036: the live auction state channel — this app is a stateless bearer-token SPA
 * (Sanctum), not session/cookie based, so Echo's default authorizer (which relies on the
 * browser sending cookies to the auth endpoint) never works here. This authorizer instead
 * attaches the stored bearer token by hand, mirroring what apiFetch does for every other
 * request.
 */
export function getEcho(): Echo<"reverb"> | null {
  if (typeof window === "undefined") return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: "reverb",
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8090),
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8090),
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
    enabledTransports: ["ws", "wss"],
    // Cast at the boundary: laravel-echo's ChannelAuthorizerGenerator type wants a precise
    // ChannelAuthorizationData shape from pusher-js that isn't worth importing just to
    // satisfy — the actual runtime contract (call back with an error-or-null, then
    // whatever /broadcasting/auth returned) is exactly what Echo/Pusher expect.
    authorizer: ((channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data?: unknown) => void) => {
        const token = getStoredToken();

        fetch(BROADCASTING_AUTH_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((response) => {
            if (!response.ok) throw new Error(`Channel auth failed: ${response.status}`);
            return response.json();
          })
          .then((data) => callback(null, data))
          .catch((err) => callback(err instanceof Error ? err : new Error("Channel auth failed")));
      },
    })) as ConstructorParameters<typeof Echo>[0]["authorizer"],
  }) as Echo<"reverb">;

  return echoInstance;
}

export function disconnectEcho() {
  echoInstance?.disconnect();
  echoInstance = null;
}
