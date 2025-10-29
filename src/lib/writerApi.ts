// Writer API Client
// Separate API client for writer-specific endpoints

import axios from 'axios';
import {
  WriterLoginRequest,
  WriterLoginResponse,
  PasswordResetRequest,
  PasswordResetConfirm,
  ProposalWriterUpdateProfile,
  BookingStatusUpdate,
  Booking,
} from '@/types/marketplace';
import { PasswordChangeRequest } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create writer-specific axios instance
const writerApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
writerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('writer_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
writerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('writer_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Try to refresh the token
        const response = await axios.post(`${API_BASE_URL}/writer-auth/refresh`, null, {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        });

        const { access_token } = response.data;
        localStorage.setItem('writer_access_token', access_token);

        // Update cookie
        document.cookie = `writer_access_token=${access_token}; path=/; max-age=3600; SameSite=Lax`;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return writerApi(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('writer_access_token');
        localStorage.removeItem('writer_refresh_token');
        localStorage.removeItem('writer_user');
        document.cookie = 'writer_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Redirect to writer login
        if (typeof window !== 'undefined') {
          window.location.href = '/writer/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// WRITER AUTHENTICATION
// ============================================================================

export async function writerLogin(credentials: WriterLoginRequest): Promise<WriterLoginResponse> {
  const response = await axios.post(`${API_BASE_URL}/writer-auth/login`, credentials);
  return response.data;
}

export async function writerChangePassword(data: PasswordChangeRequest) {
  const response = await writerApi.post('/writer-auth/change-password', data);
  return response.data;
}

export async function writerRequestPasswordReset(data: PasswordResetRequest) {
  const response = await axios.post(`${API_BASE_URL}/writer-auth/password-reset-request`, data);
  return response.data;
}

export async function writerConfirmPasswordReset(data: PasswordResetConfirm) {
  const response = await axios.post(`${API_BASE_URL}/writer-auth/password-reset-confirm`, data);
  return response.data;
}

// ============================================================================
// WRITER PROFILE MANAGEMENT
// ============================================================================

export async function getWriterProfile() {
  const response = await writerApi.get('/writer-auth/me');
  return response.data;
}

export async function updateWriterProfile(data: ProposalWriterUpdateProfile) {
  const response = await writerApi.put('/writer-auth/me', data);
  return response.data;
}

// ============================================================================
// WRITER BOOKING MANAGEMENT
// ============================================================================

export async function getWriterBookings(limit: number = 50): Promise<Booking[]> {
  const response = await writerApi.get('/writer-auth/my-bookings', {
    params: { limit },
  });
  // Backend returns {bookings: [], count: number}, extract the bookings array
  return response.data.bookings || response.data;
}

export async function updateBookingStatus(bookingId: string, update: BookingStatusUpdate) {
  const response = await writerApi.post(`/writer-auth/bookings/${bookingId}/status`, update);
  return response.data;
}

export default writerApi;
