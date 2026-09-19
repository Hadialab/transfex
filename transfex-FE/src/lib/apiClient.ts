/**
 * Thin fetch wrapper around the Transfex backend.
 *
 * Design notes:
 * - Access token lives ONLY in memory. Page reloads go through a silent
 *   /api/auth/refresh (see authStore.bootstrap).
 * - Refresh token is an httpOnly cookie managed by the browser.
 * - On a 401 from an authenticated request, one refresh is attempted, then
 *   the original request is replayed once. If the refresh fails, the app
 *   is notified via onAuthFailure.
 * - Refresh is single-flight: concurrent 401s share one HTTP refresh call.
 *   This is critical, because the backend rotates the refresh token on every
 *   call and treats a replayed token as a leak - firing two parallel
 *   refreshes kills every session.
 * - Public routes (via getPublic) opt out of both the Authorization header
 *   and the 401-retry path, so an anonymous /api/track lookup never touches
 *   the session.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  status: number;
  details?: Record<string, string[] | undefined>;

  constructor(status: number, message: string, details?: Record<string, string[] | undefined>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = null;
let onAuthFailure: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** authStore registers a callback here so a failed silent-refresh can clear app state. */
export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Internal - prevents infinite retry loops when refresh itself 401s. */
  _isRetry?: boolean;
  /** Public endpoints: don't send the token, don't retry on 401. */
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(path, API_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseErrorBody(
  res: Response
): Promise<{ message: string; details?: Record<string, string[] | undefined> }> {
  try {
    const data = await res.json();
    if (data?.error?.message) return data.error;
  } catch {
    // Response wasn't JSON (e.g. a proxy error page) - fall through to a generic message.
  }
  return { message: `Request failed with status ${res.status}` };
}

// ---------------------------------------------------------------------------
// Single-flight refresh.
//
// Only one HTTP refresh is ever in flight. All concurrent callers await the
// same promise. The slot is released once the promise settles.
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string | null> | null = null;

export function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const p = (async () => {
    try {
      const res = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAccessToken(data.accessToken);
      return data.accessToken as string;
    } catch {
      return null;
    }
  })();

  refreshPromise = p;
  // Guarded release: a newer refresh that started while this one was
  // settling must not get clobbered to null by this one's finally.
  p.finally(() => {
    if (refreshPromise === p) refreshPromise = null;
  });
  return p;
}

async function trySilentRefresh(): Promise<boolean> {
  return (await refreshSession()) !== null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, _isRetry, skipAuth } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth && accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include', // required so the browser sends the httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content - nothing to parse.
  if (res.status === 204) return undefined as T;

  if (res.status === 401 && !_isRetry && !skipAuth && !path.startsWith('/api/auth/')) {
    const refreshed = await trySilentRefresh();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }
    setAccessToken(null);
    onAuthFailure?.();
  }

  if (!res.ok) {
    const { message, details } = await parseErrorBody(res);
    throw new ApiError(res.status, message, details);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) =>
    apiRequest<T>(path, { method: 'GET', query }),
  /** For public endpoints: no Authorization header, no 401-retry path. */
  getPublic: <T>(path: string, query?: RequestOptions['query']) =>
    apiRequest<T>(path, { method: 'GET', query, skipAuth: true }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};