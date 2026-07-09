import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, ApiError, setOnSessionExpired, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

/**
 * Owns the admin session end to end. Any authenticated non-admin (a
 * pharmacist or rider with otherwise-valid credentials) is deliberately
 * refused here rather than at the backend — their credentials are real,
 * they just don't get an admin session, and are told why instead of
 * seeing a generic failure.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('unknown'); // unknown | authenticated | unauthenticated
  const [sessionMessage, setSessionMessage] = useState(null);

  const bootstrap = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    try {
      const me = await apiClient.get('/users/me');
      if (me.role !== 'admin') {
        tokenStorage.clear();
        setStatus('unauthenticated');
        return;
      }
      setUser(me);
      setStatus('authenticated');
    } catch {
      tokenStorage.clear();
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      tokenStorage.clear();
      setUser(null);
      setStatus('unauthenticated');
      setSessionMessage('Your session has expired. Please log in again.');
    });
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (email, password) => {
    const result = await apiClient.post('/auth/login', { email, password });
    if (result.user.role !== 'admin') {
      throw new ApiError({
        statusCode: 403,
        message: 'This account does not have admin access.',
      });
    }
    tokenStorage.save(result.accessToken, result.refreshToken);
    setUser(result.user);
    setStatus('authenticated');
    setSessionMessage(null);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    tokenStorage.clear();
    setUser(null);
    setStatus('unauthenticated');
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {
      // Best-effort: the local session is already cleared either way.
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, sessionMessage, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- co-locating the hook with its Provider is intentional
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
