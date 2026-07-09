/**
 * Thin, auth-aware fetch wrapper around the backend REST API — the same
 * responsibilities as the mobile app's `ApiClient` (core/network/api_client.dart):
 * attach the bearer token, transparently retry once after a silent
 * refresh on 401, and normalize errors into a single shape.
 *
 * Tokens live in localStorage. There is no httpOnly-cookie session here;
 * for an internal admin tool with the browser as the trust boundary this
 * is an accepted tradeoff, not an oversight — a real production
 * deployment behind a hardened network would likely move this to
 * cookie-based sessions instead.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ACCESS_TOKEN_KEY = 'zaad_admin_access_token';
const REFRESH_TOKEN_KEY = 'zaad_admin_refresh_token';

export class ApiError extends Error {
  constructor({ statusCode, message, details }) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  save: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

/** Invoked when a request's silent refresh also fails — wired up once by AuthContext. */
let onSessionExpired = null;
export function setOnSessionExpired(handler) {
  onSessionExpired = handler;
}

let refreshInFlight = null;

async function tryRefresh() {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = await res.json();
        return body.data;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  const result = await refreshInFlight;
  if (!result?.accessToken || !result?.refreshToken) return null;

  tokenStorage.save(result.accessToken, result.refreshToken);
  return result.accessToken;
}

async function request(path, { method = 'GET', body, query, isRetry = false } = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers = { 'Content-Type': 'application/json' };
  if (!path.startsWith('/auth/')) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({ statusCode: 0, message: 'Could not reach the server. Please check your connection.' });
  }

  if (res.status === 401 && !path.startsWith('/auth/') && !isRetry) {
    const newToken = await tryRefresh();
    if (newToken) {
      return request(path, { method, body, query, isRetry: true });
    }
    tokenStorage.clear();
    onSessionExpired?.();
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError({
      statusCode: res.status,
      message: payload?.message || 'Something went wrong. Please try again.',
      details: payload?.details,
    });
  }

  return payload?.data;
}

export const apiClient = {
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path, body) => request(path, { method: 'DELETE', body }),
};
