// Error handling utilities

interface ApiError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

/**
 * Extracts error message from unknown error type
 * Handles Axios errors and generic errors
 */
export function getErrorMessage(error: unknown, defaultMessage: string = 'An error occurred'): string {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;

    // Check for Axios error with response data
    if (apiError.response?.data?.detail) {
      return apiError.response.data.detail;
    }

    // Check for generic error message
    if (apiError.message) {
      return apiError.message;
    }
  }

  return defaultMessage;
}
