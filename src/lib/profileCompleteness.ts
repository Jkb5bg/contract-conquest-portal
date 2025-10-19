/**
 * Single source of truth for profile completeness calculations
 * Used by both dashboard and profile page
 */

export type ProfileForCompleteness = {
  company_name?: string;
  email?: string;
  cage_code?: string | null;
  uei?: string | null;
  has_identifiers?: boolean;           // true if they claim to have identifiers
  capabilities?: string[];
  has_capabilities?: boolean;          // false = explicitly none
  past_performance_agencies?: string[];
  has_agencies?: boolean;              // false = explicitly none
  primary_naics?: string[];
  geographic_preferences?: string[];
  set_aside_eligibilities?: string[];
};

/**
 * Represents which sections are complete
 * Used to show checkmarks in the profile page navigation
 */
export type SectionCompleteness = {
  basic: boolean;
  identifiers: boolean;
  naics: boolean;
  capabilities: boolean;
  experience: boolean;
  preferences: boolean;
  certifications: boolean;
};

/**
 * Helper to safely get array length
 */
const arrLen = (a?: unknown[]): number => (Array.isArray(a) ? a.length : 0);

/**
 * Helper to safely check if string is non-empty
 */
const hasString = (s?: string | null): boolean => !!(s && s.trim());

/**
 * Compute which sections are complete
 * This is the single source of truth for all completion logic
 */
export function computeSectionCompleteness(p: ProfileForCompleteness): SectionCompleteness {
  const basic = !!(p.company_name && p.email);

  const identifiers =
    hasString(p.cage_code) ||
    hasString(p.uei) ||
    (p.has_identifiers === false);

  const naics = arrLen(p.primary_naics) > 0;

  const capabilities =
    (p.has_capabilities === false) ||
    arrLen(p.capabilities) >= 3;

  const experience =
    (p.has_agencies === false) ||
    arrLen(p.past_performance_agencies) > 0;

  const preferences = arrLen(p.geographic_preferences) > 0;

  const certifications = arrLen(p.set_aside_eligibilities) > 0;

  return {
    basic,
    identifiers,
    naics,
    capabilities,
    experience,
    preferences,
    certifications,
  };
}

/**
 * Compute overall profile completeness percentage (0-100)
 * Uses the same logic as computeSectionCompleteness
 */
export function computeProfileCompleteness(p: ProfileForCompleteness): number {
  const sections = computeSectionCompleteness(p);
  let score = 0;

  if (sections.basic) score += 15;
  if (sections.identifiers) score += 15;
  if (sections.naics) score += 15;
  if (sections.capabilities) score += 20;
  if (sections.experience) score += 15;
  if (sections.preferences) score += 10;
  if (sections.certifications) score += 10;

  return score;
}

/**
 * Build the exact payload that will be sent to /profile/update
 * This is used in the profile page to:
 * 1. Calculate completeness scores consistently
 * 2. Show accurate section checkmarks
 * 3. Prepare data for save
 *
 * By using this function, the profile page always calculates completeness
 * the same way the backend will see it after save
 */
export function buildProfilePayload(p: ProfileForCompleteness): ProfileForCompleteness {
  return {
    company_name: p.company_name,
    email: p.email,
    cage_code: p.cage_code,
    uei: p.uei,
    has_identifiers: p.has_identifiers,
    capabilities: p.capabilities || [],
    has_capabilities: p.has_capabilities,
    past_performance_agencies: p.past_performance_agencies || [],
    has_agencies: p.has_agencies,
    primary_naics: p.primary_naics || [],
    geographic_preferences: p.geographic_preferences || [],
    set_aside_eligibilities: p.set_aside_eligibilities || [],
  };
}