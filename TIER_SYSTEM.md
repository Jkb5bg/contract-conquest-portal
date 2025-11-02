# Tier System & API Integration

## Overview

The frontend uses a **tier mapping layer** to translate between backend tier names and user-facing tier names. This ensures consistent terminology across the application while maintaining compatibility with the backend API.

## Tier Name Mapping

### Backend → Frontend Translation

| Backend Tier | Frontend Tier | Display Name |
|--------------|---------------|--------------|
| `basic` | `starter` | "Starter Plan" |
| `premium` | `pro` | "Pro Plan" |

### How It Works

1. **API Responses**: When the backend returns `subscription_tier: "basic"`, the API client automatically converts it to `subscription_tier: "starter"` before it reaches React components.

2. **Type Safety**: Throughout the frontend code, the `SubscriptionTier` type is defined as `'starter' | 'pro'`, ensuring type safety.

3. **Automatic Mapping**: The mapping happens transparently in `src/lib/api.ts` using the response interceptor.

## Tier Features & Limits

### Starter Plan (Backend: "basic")
- ✅ **NAICS Codes**: 3 maximum
- ✅ **Opportunity Match Score**: Minimum 75%
- ✅ **Writer Contacts**: Unlimited
- ✅ **Daily Opportunities**: Score ≥ 0.75

### Pro Plan (Backend: "premium")
- ✅ **NAICS Codes**: 5 maximum
- ✅ **Opportunity Match Score**: Minimum 50%
- ✅ **Writer Contacts**: Unlimited
- ✅ **Daily Opportunities**: Score ≥ 0.5

## Implementation Details

### Tier Mapping Utility

Location: `src/lib/tierMapping.ts`

```typescript
// Map backend tier to frontend display
mapBackendToFrontend('basic') // → 'starter'
mapBackendToFrontend('premium') // → 'pro'

// Get tier limits
getTierLimits('starter') // → { maxNaicsCodes: 3, minOpportunityScore: 0.75, ... }
getTierLimits('pro') // → { maxNaicsCodes: 5, minOpportunityScore: 0.5, ... }
```

### API Client Integration

Location: `src/lib/api.ts`

The API client automatically transforms tier names in all responses:

```typescript
// Backend responds with: { subscription_tier: "basic" }
// Frontend receives: { subscription_tier: "starter" }
```

### Components Using Tier Info

1. **Dashboard** (`src/app/dashboard/page.tsx`)
   - Displays tier badge and benefits
   - Fetches tier-appropriate opportunities
   - Shows upgrade CTA for Starter users

2. **Profile Page** (`src/app/dashboard/profile/page.tsx`)
   - Enforces tier-based NAICS limits
   - Displays tier benefits in header
   - Shows upgrade prompts

3. **Opportunities Page** (`src/app/dashboard/opportunities/page.tsx`)
   - Displays minimum score requirements
   - Shows tier-specific filtering info

## Rate Limiting (HTTP 429)

### Backend Configuration

- **Production**: 100 requests/minute per IP
- **Development**: 1000 requests/minute per IP

### Frontend Handling

When a rate limit is exceeded:

1. **API Client** (`src/lib/api.ts`) catches the 429 error
2. **Event Dispatched**: Fires `rate-limit-exceeded` custom event
3. **UI Notification**: `GlobalErrorHandler` displays an alert
4. **User Message**: "Too many requests. Please wait X seconds and try again."

### Implementation

```typescript
// Error structure
{
  status: 429,
  retryAfter: 60, // seconds
  message: "Too many requests. Please wait 60 seconds and try again."
}
```

### Global Error Handler

Location: `src/components/GlobalErrorHandler.tsx`

- Listens for rate limit events
- Displays notification in top-right corner
- Auto-dismisses after retry period

## Upgrading Users

To upgrade a user from Starter to Pro:

### Database Update

```sql
-- Update subscription tier in database
UPDATE client_profiles
SET subscription_tier = 'premium'  -- Note: Use 'premium', not 'pro'
WHERE email = 'user@example.com';
```

### Verification

The frontend will automatically:
1. Fetch the updated tier on next API call
2. Map `"premium"` → `"pro"` for display
3. Update UI to show Pro benefits
4. Remove NAICS code limits restriction (5 instead of 3)
5. Show opportunities with lower match scores (50% instead of 75%)

## Type Definitions

### Profile Type
```typescript
// src/types/profile.ts
export type SubscriptionTier = 'starter' | 'pro';

export interface ClientProfile {
  subscription_tier?: SubscriptionTier;
  // ... other fields
}
```

### Marketplace Type
```typescript
// src/types/marketplace.ts
export interface TierInfo {
  tier_name: SubscriptionTier;
  max_naics_codes: number;
  min_opportunity_score: number;
  // ... other fields
}
```

## Testing

### Test Tier Mapping

1. Set user to `"basic"` in database
2. Frontend should display "Starter Plan"
3. NAICS limit should be 3
4. Min score should be 75%

### Test Rate Limiting

1. Make 100+ API requests in 1 minute
2. Should see rate limit notification
3. Should display retry countdown
4. Notification should auto-dismiss

## Migration Notes

### From Old Tier Names

If you previously used different tier names:

1. **Update Database**: Change all `subscription_tier` values to either `'basic'` or `'premium'`
2. **Clear Cache**: Users may need to refresh or clear localStorage
3. **Verify**: Check that tier display updates correctly

### Backend Compatibility

The frontend is compatible with backends using:
- ✅ `"basic"` and `"premium"` tier names
- ✅ Automatic mapping to `"starter"` and `"pro"` for display
- ✅ No frontend code changes needed if backend tier names change (just update the mapping utility)
