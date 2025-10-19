'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { User, LoginResponse } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isPasswordTemporary: boolean;
  tokenExpiresAt: number | null; // Unix timestamp in seconds
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Decode a JWT token to extract claims
 * WARNING: This decodes without verification. Verification happens on the backend.
 */
function decodeJWT(token: string): Record<string, never> | null {
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
    return decoded.exp;
  }
  return null;
}

/**
 * Check if token is expired or expiring soon (within 5 minutes)
 */
function isTokenExpiredOrExpiringSoon(expiresAt: number | null): boolean {
  if (!expiresAt) return true;

  const now = Math.floor(Date.now() / 1000);
  const fiveMinutesInSeconds = 5 * 60;

  return now >= (expiresAt - fiveMinutesInSeconds);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordTemporary, setIsPasswordTemporary] = useState(false);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  /**
   * Schedule a token refresh before it expires
   * Refreshes when there's 10 minutes left
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Clear any existing timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    const now = Math.floor(Date.now() / 1000);
    const tenMinutesInSeconds = 10 * 60;
    const refreshAt = expiresAt - tenMinutesInSeconds;
    const millisecondsUntilRefresh = Math.max(0, (refreshAt - now) * 1000);

    console.log(`Token expires at: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`Scheduled refresh in: ${(millisecondsUntilRefresh / 1000 / 60).toFixed(2)} minutes`);

    const timeout = setTimeout(async () => {
      console.log('Proactively refreshing token...');
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await apiClient.post('/auth/refresh', null, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          const newExpiresAt = getTokenExpiration(access_token);
          if (newExpiresAt) {
            setTokenExpiresAt(newExpiresAt);
            scheduleTokenRefresh(newExpiresAt); // Schedule next refresh
            console.log('Token refreshed successfully');
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If refresh fails, logout the user
        localStorage.clear();
        setUser(null);
        setTokenExpiresAt(null);
        router.push('/login');
      }
    }, millisecondsUntilRefresh);

    setRefreshTimeout(timeout);
  }, [refreshTimeout, router]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));

          // Get token expiration
          const expiresAt = getTokenExpiration(token);
          if (expiresAt) {
            setTokenExpiresAt(expiresAt);

            // If token is expired or expiring soon, refresh it now
            if (isTokenExpiredOrExpiringSoon(expiresAt)) {
              console.log('Existing token is expired or expiring soon, attempting refresh...');
              try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                  const response = await apiClient.post('/auth/refresh', null, {
                    headers: {
                      Authorization: `Bearer ${refreshToken}`,
                    },
                  });

                  const { access_token } = response.data;
                  localStorage.setItem('access_token', access_token);
                  const newExpiresAt = getTokenExpiration(access_token);
                  if (newExpiresAt) {
                    setTokenExpiresAt(newExpiresAt);
                    scheduleTokenRefresh(newExpiresAt);
                  }
                }
              } catch (refreshError) {
                console.error('Failed to refresh token on init:', refreshError);
                localStorage.clear();
                setUser(null);
                setTokenExpiresAt(null);
              }
            } else {
              // Schedule refresh for later
              scheduleTokenRefresh(expiresAt);
            }
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.clear();
        }
      }

      setIsLoading(false);
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [scheduleTokenRefresh]);

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
        setTokenExpiresAt(expiresAt);
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
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPasswordTemporary(false);
    setTokenExpiresAt(null);
    router.push('/login');
  }, [refreshTimeout, router]);

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
        tokenExpiresAt,
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