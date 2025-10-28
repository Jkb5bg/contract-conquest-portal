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

// Maximum safe setTimeout delay (about 24.8 days in milliseconds)
const MAX_TIMEOUT_MS = 2147483647;

/**
 * Decode a JWT token to extract claims
 * WARNING: This will decode without verification. Verification happens on the backend.
 */
function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    return JSON.parse(atob(parts[1]));
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
    return decoded.exp as number;
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
  const scheduleTokenRefreshRef = useRef<((expiresAt: number) => void) | null>(null);

  /**
   * Persist user to localStorage
   */
  const persistUser = useCallback((userInfo: User | null) => {
    if (userInfo) {
      localStorage.setItem('user', JSON.stringify(userInfo));
    } else {
      localStorage.removeItem('user');
    }
  }, []);

  /**
   * Load user from localStorage
   */
  const loadUserFromStorage = useCallback((): User | null => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      return null;
    }
  }, []);

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
      document.cookie = `access_token=${access_token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      console.log('Token refreshed successfully');

      // Schedule next refresh using ref to avoid circular dependency
      const expiresAt = getTokenExpiration(access_token);
      if (expiresAt && scheduleTokenRefreshRef.current) {
        scheduleTokenRefreshRef.current(expiresAt);
      }
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
   * Schedule a token refresh before it expires
   * Handles long-lived tokens by respecting setTimeout max delay
   */
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Cancel any existing refresh schedule
    cancelTokenRefresh();

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expiresAt - now;

    console.log(`Token expires at: ${new Date(expiresAt * 1000).toISOString()}`);
    console.log(`Time until expiration: ${(timeUntilExpiration / 60 / 60 / 24).toFixed(1)} days`);

    if (timeUntilExpiration <= 120) {
      console.log('Token expiring soon, refreshing now');
      attemptTokenRefresh();
      return;
    }

    const sevenDaysInSeconds = 7 * 24 * 60 * 60;
    if (timeUntilExpiration > sevenDaysInSeconds) {
      console.log('Token is long-lived (> 7 days), no automatic refresh scheduled');
      return;
    }

    const tenMinutesInSeconds = 10 * 60;
    const refreshAt = expiresAt - tenMinutesInSeconds;
    const millisecondsUntilRefresh = Math.max(0, (refreshAt - now) * 1000);

    if (millisecondsUntilRefresh > MAX_TIMEOUT_MS) {
      console.log('Refresh time exceeds setTimeout max, will check on next load');
      return;
    }

    console.log(`Scheduled refresh in: ${(millisecondsUntilRefresh / 1000 / 60).toFixed(2)} minutes`);

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('Token refresh scheduled time reached');
      await attemptTokenRefresh();
    }, millisecondsUntilRefresh);
  }, [attemptTokenRefresh, cancelTokenRefresh]);

  // Update the ref whenever scheduleTokenRefresh changes
  useEffect(() => {
    scheduleTokenRefreshRef.current = scheduleTokenRefresh;
  }, [scheduleTokenRefresh]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');

        if (token) {
          // Check token expiration first
          const expiresAt = getTokenExpiration(token);
          const now = Math.floor(Date.now() / 1000);

          if (expiresAt && now >= expiresAt) {
            console.log('Token expired, attempting refresh...');
            await attemptTokenRefresh();
            // After refresh attempt, re-check if we have a valid token
            const newToken = localStorage.getItem('access_token');
            if (!newToken) {
              setIsLoading(false);
              return;
            }
          }

          // Token is valid, try to fetch fresh user data from backend
          try {
            console.log('Token found, fetching user data from backend...');
            const response = await apiClient.get('/profile/me');
            const profile = response.data;

            // Extract user info from profile
            const userInfo: User = {
              email: profile.email,
              client_id: profile.client_id,
              user_id: 0,
            };

            setUser(userInfo);
            persistUser(userInfo);
            console.log('✅ User loaded from backend:', userInfo.email);

            // Ensure cookie is set/refreshed
            const currentToken = localStorage.getItem('access_token');
            if (currentToken) {
              const maxAge = 7 * 24 * 60 * 60; // 7 days
              document.cookie = `access_token=${currentToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
            }

            // Schedule token refresh if needed
            if (expiresAt) {
              const daysUntilExpiry = (expiresAt - now) / (24 * 60 * 60);
              console.log(`Token valid for ${daysUntilExpiry.toFixed(1)} more days`);

              if (daysUntilExpiry < 7) {
                scheduleTokenRefresh(expiresAt);
              }
            }
          } catch (error) {
            console.error('Failed to fetch user data from backend:', error);
            // Try to load from localStorage as fallback
            const storedUser = loadUserFromStorage();
            if (storedUser) {
              setUser(storedUser);
              console.log('✅ User loaded from localStorage (backend unavailable):', storedUser.email);

              // Still ensure cookie is set for middleware
              const currentToken = localStorage.getItem('access_token');
              if (currentToken) {
                const maxAge = 7 * 24 * 60 * 60; // 7 days
                document.cookie = `access_token=${currentToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
              }
            } else {
              // No fallback, clear everything
              console.log('No cached user, logging out');
              localStorage.clear();
              document.cookie = 'access_token=; path=/; max-age=0';
              setUser(null);
            }
          }
        } else {
          // No token, check if we have cached user (shouldn't normally happen)
          const storedUser = loadUserFromStorage();
          if (storedUser) {
            setUser(storedUser);
            console.log('User loaded from localStorage (no token found)');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      cancelTokenRefresh();
    };
  }, [attemptTokenRefresh, scheduleTokenRefresh, cancelTokenRefresh, persistUser, loadUserFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      const data = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // Set cookie for middleware with SameSite=Lax for better SSR compatibility
      const maxAge = 7 * 24 * 60 * 60; // 7 days
      document.cookie = `access_token=${data.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Create user object
      const userInfo: User = {
        email,
        client_id: data.client_id,
        user_id: 0,
      };

      // Set user state and persist
      setUser(userInfo);
      persistUser(userInfo);
      setIsPasswordTemporary(data.is_password_temporary);

      // Get token expiration and schedule refresh if needed
      const expiresAt = getTokenExpiration(data.access_token);
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const daysUntilExpiry = (expiresAt - now) / (24 * 60 * 60);
        if (daysUntilExpiry < 7) {
          scheduleTokenRefresh(expiresAt);
        }
      }

      // Use window.location instead of router.push to ensure proper cookie propagation
      // This forces a full page reload which ensures middleware sees the cookie
      if (data.is_password_temporary) {
        window.location.href = '/change-password';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error: unknown) {
      let message = 'Login failed';

      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { detail?: string } } }).response?.data?.detail === 'string'
      ) {
        message = (error as { response: { data: { detail: string } } }).response.data.detail;
      }

      throw new Error(message);
    }
  }, [scheduleTokenRefresh, persistUser]);

  const logout = useCallback(() => {
    cancelTokenRefresh();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = 'access_token=; path=/; max-age=0';
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
      const message = (error as unknown).response?.data?.detail || 'Failed to change password';
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