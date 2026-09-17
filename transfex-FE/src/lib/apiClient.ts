/**
 * Thin fetch wrapper around the Transfex backend.
 *
 * Design notes (mirrors the backend's own choices, see transfex-backend/README):
 * - The access token lives ONLY in memory (a module-level variable here) — never
 *   in localStorage/sessionStorage. A page reload always goes through a silent
 *   `/api/auth/refresh` call (see authStore's `bootstrap`) to get a new one.
 * - The refresh token is an httpOnly cookie the browser manages automatically;
 *   we never read or store it ourselves. `credentials: 'include'` on every
 *   request is what makes the browser attach it.
 * - On a 401 from any authenticated request (except /auth/* itself), we try
 *   exactly one silent refresh, then replay the original request once. If the
 *   refresh also fails, we clear the token and notify whoever registered
 *   `onAuthFailure` (authStore) so the app-wide user state gets cleared too.
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
  /** Internal — prevents infinite retry loops when refresh itself 401s. */
  _isRetry?: boolean;
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

async function parseErrorBody(res: Response): Promise<{ message: string; details?: Record<string, string[] | undefined> }> {
  try {
    const data = await res.json();
    if (data?.error?.message) return data.error;
  } catch {
    // Response wasn't JSON (e.g. a proxy error page) — fall through to a generic message.
  }
  return { message: `Request failed with status ${res.status}` };
}

/** One attempt at POST /api/auth/refresh. Never throws — returns whether it worked. */
async function trySilentRefresh(): Promise<boolean> {
  try {
    const res = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    setAccessToken(data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, _isRetry } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    credentials: 'include', // required so the browser sends the httpOnly refresh cookie
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — nothing to parse.
  if (res.status === 204) return undefined as T;

  if (res.status === 401 && !_isRetry && !path.startsWith('/api/auth/')) {
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
  get: <T>(path: string, query?: RequestOptions['query']) => apiRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};