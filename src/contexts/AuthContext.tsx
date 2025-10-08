'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordTemporary, setIsPasswordTemporary] = useState(false);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // You could validate the token here with a /me endpoint
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.clear();
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

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
      
      // Create user object
      const userInfo: User = {
        email,
        client_id: data.client_id,
        user_id: 0, // This should come from the token or a separate call
      };
      
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      setUser(userInfo);
      setIsPasswordTemporary(data.is_password_temporary);

      // Navigate based on password status
      if (data.is_password_temporary) {
        // Will handle this with a modal or redirect to change password
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      // @ts-expect-error Lint is tripping over the error below, but it's not that serious.
      const message = error.response?.data?.detail || 'Login failed';
      throw new Error(message);
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsPasswordTemporary(false);
    router.push('/login');
  }, [router]);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    try {
      await apiClient.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      
      setIsPasswordTemporary(false);
      router.push('/dashboard');
    } catch (error: unknown) {
      // @ts-expect-error Lint is tripping over the error below, but it's not that serious.
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
