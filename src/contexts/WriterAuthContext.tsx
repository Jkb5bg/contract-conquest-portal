'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import {
  writerLogin,
  writerChangePassword,
  getWriterProfile,
} from '@/lib/writerApi';
import { WriterLoginRequest, WriterLoginResponse } from '@/types/marketplace';
import { ChangePasswordRequest } from '@/types/auth';

interface WriterUser {
  writer_id: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
}

interface WriterAuthContextType {
  user: WriterUser | null;
  isLoading: boolean;
  isPasswordTemporary: boolean;
  login: (credentials: WriterLoginRequest) => Promise<WriterLoginResponse>;
  logout: () => void;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const WriterAuthContext = createContext<WriterAuthContextType | undefined>(undefined);

export function WriterAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WriterUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordTemporary, setIsPasswordTemporary] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('writer_access_token');
      const savedUser = localStorage.getItem('writer_user');
      const tempPassword = localStorage.getItem('writer_temp_password') === 'true';

      if (token && savedUser) {
        try {
          // Verify token is not expired
          const decoded: { exp?: number } = jwtDecode(token);
          const now = Date.now() / 1000;

          if (decoded.exp && decoded.exp > now) {
            setUser(JSON.parse(savedUser));
            setIsPasswordTemporary(tempPassword);

            // Schedule token refresh 10 minutes before expiration
            const timeUntilRefresh = (decoded.exp - now - 600) * 1000;
            if (timeUntilRefresh > 0) {
              setTimeout(() => {
                refreshUserProfile();
              }, timeUntilRefresh);
            }
          } else {
            // Token expired, clear session
            logout();
          }
        } catch (error) {
          console.error('Invalid token:', error);
          logout();
        }
      }

      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (credentials: WriterLoginRequest): Promise<WriterLoginResponse> => {
    const response = await writerLogin(credentials);

    // Store tokens
    localStorage.setItem('writer_access_token', response.access_token);
    localStorage.setItem('writer_refresh_token', response.refresh_token);

    // Set access token as cookie for middleware
    document.cookie = `writer_access_token=${response.access_token}; path=/; max-age=3600; SameSite=Lax`;

    // Store user info
    const writerUser: WriterUser = {
      writer_id: response.writer_id,
      email: response.email,
    };
    localStorage.setItem('writer_user', JSON.stringify(writerUser));
    localStorage.setItem('writer_temp_password', String(response.is_password_temporary));

    setUser(writerUser);
    setIsPasswordTemporary(response.is_password_temporary);

    return response;
  };

  const logout = () => {
    localStorage.removeItem('writer_access_token');
    localStorage.removeItem('writer_refresh_token');
    localStorage.removeItem('writer_user');
    localStorage.removeItem('writer_temp_password');
    document.cookie = 'writer_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

    setUser(null);
    setIsPasswordTemporary(false);
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    await writerChangePassword(data);
    setIsPasswordTemporary(false);
    localStorage.setItem('writer_temp_password', 'false');
  };

  const refreshUserProfile = async () => {
    try {
      const profile = await getWriterProfile();
      const writerUser: WriterUser = {
        writer_id: profile.writer_id,
        email: profile.email,
        full_name: profile.full_name,
        is_active: profile.is_active,
      };
      localStorage.setItem('writer_user', JSON.stringify(writerUser));
      setUser(writerUser);
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
    }
  };

  return (
    <WriterAuthContext.Provider
      value={{
        user,
        isLoading,
        isPasswordTemporary,
        login,
        logout,
        changePassword,
        refreshUserProfile,
      }}
    >
      {children}
    </WriterAuthContext.Provider>
  );
}

export function useWriterAuth() {
  const context = useContext(WriterAuthContext);
  if (context === undefined) {
    throw new Error('useWriterAuth must be used within a WriterAuthProvider');
  }
  return context;
}
