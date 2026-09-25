const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
const TOKEN_STORAGE_KEY = "hmp_api_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * A Laravel validation failure's top-level `message` is a generic "The given data was
 * invalid." — never which field, or why. This pulls the specific per-field messages out of
 * the `errors` object when present, so a caller shows "That email is already registered."
 * instead of a dead end the user can't act on.
 */
export function describeApiError(err: unknown, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;

  const body = err.body as { errors?: Record<string, string[]> } | null;
  if (body?.errors) {
    return Object.values(body.errors).flat().join(" ");
  }

  return err.message || fallback;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage unavailable (private mode etc.) — nothing to fall back to for a
    // bearer-token SPA, so the caller just stays logged out.
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

/**
 * Backend (HMP-backend) uses stateless Sanctum bearer tokens, not cookies — so every
 * authenticated call attaches `Authorization: Bearer <token>` rather than relying on
 * `credentials: 'include'`/CSRF cookies.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  // A FormData body (file upload) must NOT get a manual Content-Type — the browser sets
  // one itself with the correct multipart boundary, which we can't reproduce by hand.
  if (body !== undefined && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(
      (data && typeof data === "object" && "message" in data && String(data.message)) ||
        `Request to ${path} failed with status ${response.status}`,
      response.status,
      data
    );
  }

  return data as T;
}

/**
 * Downloads a file from an authenticated endpoint (e.g. a vault PDF). A plain <a href> can't
 * carry the bearer token, so this fetches the bytes with it and triggers a browser save.
 * `url` may be a full "/api/..." path as returned by the backend or an API-relative one.
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const relative = url.replace(/^\/api/, "");
  const token = getStoredToken();

  const response = await fetch(`${API_URL}${relative}`, {
    headers: token ? { Authorization: `Bearer ${token}`, Accept: "application/pdf,*/*" } : { Accept: "application/pdf,*/*" },
  });

  if (!response.ok) {
    throw new ApiError(`Download failed with status ${response.status}`, response.status, null);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
