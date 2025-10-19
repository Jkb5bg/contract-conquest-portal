'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, LoginResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPasswordTemporary: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decode a JWT token to extract claims
 * WARNING: This decodes without verification. Verification happens on the backend.
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Extract expiration time from JWT token
 * Returns unix timestamp in seconds, or null if unable to decode
 */
function getTokenExpiration(token: string): number | null {
  const decoded = decodeJWT(token);
  if (decoded && decoded.exp) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return decoded.exp;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordTemporary, setIsPasswordTemporary] = useState(false);
  const router = useRouter();

  // Use refs to avoid infinite loops with timeouts
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  /**
   * Attempt to refresh the token
   * Uses ref to prevent concurrent refresh attempts
   */
  const attemptTokenRefresh = useCallback(async () => {
    // Prevent concurrent refresh attempts
    if (isRefreshingRef.current) {
      console.log('Token refresh already in progress, skipping...');
      return;
    }

    try {
      isRefreshingRef.current = true;
      console.log('Attempting token refresh...');

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.log('No refresh token available');
        return;
      }

      const response = await apiClient.post('/auth/refresh', null, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // On refresh failure, logout the user
      localStorage.clear();
      setUser(null);
      setIsPasswordTemporary(false);
      router.push('/login');
    } finally {
      isRefreshingRef.current = false;
    }
  }, [router]);

  /**
   * Cancel any pending token refresh
   */
  const cancelTokenRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
      console.log('Cancelled pending token refresh');
    }
  }, []);

  /**
   * Schedule a token refresh before it expires
   * IMPORTANT: Only call this once per token, not on every render
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Cancel any existing refresh schedule
    cancelTokenRefresh();

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expiresAt - now;

    // If token is already expired or expiring in less than 2 minutes, refresh now
    if (timeUntilExpiration <= 120) {
      console.log('Token expiring soon, refreshing now');
      attemptTokenRefresh();
      return;
    }

    // Schedule refresh for 10 minutes before expiration
    const tenMinutesInSeconds = 10 * 60;
    const refreshAt = expiresAt - tenMinutesInSeconds;
    const millisecondsUntilRefresh = Math.max(0, (refreshAt - now) * 1000);

    console.log(`Token expires at: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`Scheduled refresh in: ${(millisecondsUntilRefresh / 1000 / 60).toFixed(2)} minutes`);

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('Token refresh scheduled time reached');
      await attemptTokenRefresh();

      // After refresh, get new token and reschedule
      const newToken = localStorage.getItem('access_token');
      if (newToken) {
        const newExpiresAt = getTokenExpiration(newToken);
        if (newExpiresAt) {
          scheduleTokenRefresh(newExpiresAt);
        }
      }
    }, millisecondsUntilRefresh);
  }, [attemptTokenRefresh, cancelTokenRefresh]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          try {
            setUser(JSON.parse(storedUser));

            // Schedule token refresh if we have a token
            const expiresAt = getTokenExpiration(token);
            if (expiresAt) {
              const now = Math.floor(Date.now() / 1000);
              if (now >= expiresAt - 60) {
                // Token expired or expiring in less than 1 minute, refresh now
                console.log('Existing token expired or expiring, attempting refresh...');
                await attemptTokenRefresh();
              } else {
                // Schedule refresh for later
                scheduleTokenRefresh(expiresAt);
              }
            }
          } catch (parseError) {
            console.error('Failed to parse stored user:', parseError);
            localStorage.clear();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      cancelTokenRefresh();
    };
  }, []); // Empty dependency array - runs only once on mount

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const data = response.data;

      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // Get token expiration and schedule refresh
      const expiresAt = getTokenExpiration(data.access_token);
      if (expiresAt) {
        scheduleTokenRefresh(expiresAt);
      }

      // Create user object
      const userInfo: User = {
        email,
        client_id: data.client_id,
        user_id: 0,
      };

      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      setIsPasswordTemporary(data.is_password_temporary);

      // Navigate based on password status
      if (data.is_password_temporary) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const message = error.response?.data?.detail || 'Login failed';
      throw new Error(message);
    }
  }, [scheduleTokenRefresh, router]);

  const logout = useCallback(() => {
    cancelTokenRefresh();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPasswordTemporary(false);
    router.push('/login');
  }, [cancelTokenRefresh, router]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });

      setIsPasswordTemporary(false);
      router.push('/dashboard');
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const message = error.response?.data?.detail || 'Failed to change password';
      throw new Error(message);
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isPasswordTemporary,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};