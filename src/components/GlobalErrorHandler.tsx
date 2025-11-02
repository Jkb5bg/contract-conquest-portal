'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui';

interface RateLimitError {
  retryAfter: number;
  message: string;
}

/**
 * Global Error Handler Component
 *
 * Listens for rate limit errors (HTTP 429) from the API client
 * and displays user-friendly notifications.
 */
export default function GlobalErrorHandler() {
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);

  useEffect(() => {
    const handleRateLimitExceeded = (event: Event) => {
      const customEvent = event as CustomEvent<RateLimitError>;
      setRateLimitError(customEvent.detail);

      // Auto-hide after the retry period
      setTimeout(() => {
        setRateLimitError(null);
      }, customEvent.detail.retryAfter * 1000);
    };

    window.addEventListener('rate-limit-exceeded', handleRateLimitExceeded);

    return () => {
      window.removeEventListener('rate-limit-exceeded', handleRateLimitExceeded);
    };
  }, []);

  if (!rateLimitError) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert
        type="error"
        message={rateLimitError.message}
        onClose={() => setRateLimitError(null)}
      />
    </div>
  );
}
