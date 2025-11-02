/**
 * Tier Mapping Utilities
 *
 * The backend uses "basic" and "premium" internally,
 * but we display "Starter" and "Pro" to users for better UX.
 */

// Backend tier names (what the API uses)
export type BackendTier = 'basic' | 'premium';

// Frontend tier names (what we show to users)
export type FrontendTier = 'starter' | 'pro';

/**
 * Map backend tier name to frontend display name
 */
export function mapBackendToFrontend(backendTier: BackendTier | null | undefined): FrontendTier {
  if (backendTier === 'premium') return 'pro';
  return 'starter'; // Default to starter for 'basic', null, or undefined
}

/**
 * Map frontend tier name to backend API name
 */
export function mapFrontendToBackend(frontendTier: FrontendTier): BackendTier {
  if (frontendTier === 'pro') return 'premium';
  return 'basic';
}

/**
 * Get tier display name for UI
 */
export function getTierDisplayName(tier: FrontendTier): string {
  return tier === 'pro' ? 'Pro Plan' : 'Starter Plan';
}

/**
 * Get tier emoji
 */
export function getTierEmoji(tier: FrontendTier): string {
  return tier === 'pro' ? '💎' : '🚀';
}

/**
 * Get tier limits based on frontend tier name
 */
export function getTierLimits(tier: FrontendTier) {
  return {
    maxNaicsCodes: tier === 'pro' ? 5 : 3,
    minOpportunityScore: tier === 'pro' ? 0.5 : 0.75,
    writerContacts: 'unlimited' as const,
  };
}
