/**
 * CSP Utilities
 *
 * Helper functions for working with Content Security Policy nonces
 */

import { headers } from 'next/headers';

/**
 * Get the CSP nonce for the current request
 *
 * This should be called from Server Components only.
 * Use this nonce for inline scripts to comply with CSP.
 *
 * @returns The nonce string, or undefined if not available
 */
export async function getNonce(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    return headersList.get('x-nonce') || undefined;
  } catch (error) {
    // In client components or when headers are not available
    console.warn('CSP nonce not available. This is expected in client components.');
    return undefined;
  }
}
