import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { mapBackendToFrontend } from './tierMapping';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle tier mapping and errors
apiClient.interceptors.response.use(
  (response) => {
    // Map backend tier names (basic/premium) to frontend tier names (starter/pro)
    if (response.data && typeof response.data === 'object') {
      if ('subscription_tier' in response.data) {
        response.data.subscription_tier = mapBackendToFrontend(response.data.subscription_tier);
      }

      // Handle tier info in nested objects
      if ('tier_name' in response.data) {
        response.data.tier_name = mapBackendToFrontend(response.data.tier_name);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 429 Rate Limit errors
    if (error.response?.status === 429) {
      const retryAfter = (error.response.data as any)?.retry_after ||
                        error.response.headers['retry-after'] ||
                        60;

      console.warn(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);

      // Show user-friendly error message
      const errorMessage = `Too many requests. Please wait ${retryAfter} seconds and try again.`;

      // Dispatch custom event that can be caught by UI components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('rate-limit-exceeded', {
          detail: { retryAfter, message: errorMessage }
        }));
      }

      // Enhance error with user-friendly message
      const enhancedError = new Error(errorMessage) as any;
      enhancedError.retryAfter = retryAfter;
      enhancedError.status = 429;
      return Promise.reject(enhancedError);
    }

    // Handle 401 Unauthorized with token refresh
    if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
      (originalRequest as any)._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE}/auth/refresh`, null, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
