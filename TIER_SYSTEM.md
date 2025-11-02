# Tier System & API Integration

## Overview

Both the **backend and frontend** use the same tier names: `"starter"` and `"pro"`. This ensures consistent terminology across the entire application without requiring any translation layer.

## Tier Features & Limits

### Starter Plan
- ✅ **NAICS Codes**: 3 maximum
- ✅ **Opportunity Match Score**: Minimum 75%
- ✅ **Writer Contacts**: Unlimited
- ✅ **Daily Opportunities**: Score ≥ 0.75

### Pro Plan
- ✅ **NAICS Codes**: 5 maximum
- ✅ **Opportunity Match Score**: Minimum 50%
- ✅ **Writer Contacts**: Unlimited
- ✅ **Daily Opportunities**: Score ≥ 0.5

## Implementation Details

### Tier Utility Functions

Location: `src/lib/tierMapping.ts`

```typescript
// Get display names
getTierDisplayName('starter') // → "Starter Plan"
getTierDisplayName('pro') // → "Pro Plan"

// Get tier emojis
getTierEmoji('starter') // → "🚀"
getTierEmoji('pro') // → "💎"

// Get tier limits
getTierLimits('starter') // → { maxNaicsCodes: 3, minOpportunityScore: 0.75, ... }
getTierLimits('pro') // → { maxNaicsCodes: 5, minOpportunityScore: 0.5, ... }
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
SET subscription_tier = 'pro'
WHERE email = 'user@example.com';
```

### Verification

The frontend will automatically:
1. Fetch the updated tier on next API call
2. Update UI to show Pro benefits
3. Update NAICS code limit to 5 (from 3)
4. Show opportunities with lower match scores (50% instead of 75%)

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

### From Old Tier Names (basic/premium)

If you previously used `"basic"` and `"premium"` tier names, update your database:

```sql
-- Update all tier names to new convention
UPDATE client_profiles
SET subscription_tier = 'starter'
WHERE subscription_tier = 'basic';

UPDATE client_profiles
SET subscription_tier = 'pro'
WHERE subscription_tier = 'premium';
```

### Backend & Frontend Alignment

Both systems now use the same tier names:
- ✅ Backend stores: `"starter"` and `"pro"`
- ✅ Frontend displays: "Starter Plan" and "Pro Plan"
- ✅ No translation layer needed
- ✅ Type-safe throughout the application
