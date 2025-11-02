/**
 * Tier Utilities
 *
 * Helper functions for working with subscription tiers.
 * Both backend and frontend use 'starter' and 'pro' tier names.
 */

export type SubscriptionTier = 'starter' | 'pro';

/**
 * Get tier display name for UI
 */
export function getTierDisplayName(tier: SubscriptionTier | null | undefined): string {
  if (tier === 'pro') return 'Pro Plan';
  return 'Starter Plan'; // Default to Starter for null/undefined
}

/**
 * Get tier emoji
 */
export function getTierEmoji(tier: SubscriptionTier | null | undefined): string {
  if (tier === 'pro') return '💎';
  return '🚀'; // Default to Starter emoji
}

/**
 * Get tier limits based on tier name
 */
export function getTierLimits(tier: SubscriptionTier | null | undefined) {
  const isPro = tier === 'pro';
  return {
    maxNaicsCodes: isPro ? 5 : 3,
    minOpportunityScore: isPro ? 0.5 : 0.75,
    writerContacts: 'unlimited' as const,
  };
}
