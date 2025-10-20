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
 * Helper to safely check if string is non-empty and not "None"
 */
const hasString = (s?: string | null): boolean => !!(s && s.trim() && s !== 'None');

/**
 * Helper to check if array has "None" value
 */
const hasNoneValue = (a?: string[]): boolean => {
  return Array.isArray(a) && a.length === 1 && a[0] === 'None';
};

/**
 * Compute which sections are complete
 * This is the single source of truth for all completion logic
 */
export function computeSectionCompleteness(p: ProfileForCompleteness): SectionCompleteness {
  const basic = !!(p.company_name && p.email);

  // Identifiers section is complete if:
  // - They have a valid CAGE code (not null, not empty, not "None"), OR
  // - They have a valid UEI (not null, not empty, not "None"), OR
  // - They explicitly marked both as None
  const identifiers =
    hasString(p.cage_code) ||
    hasString(p.uei) ||
    (p.cage_code === 'None' && p.uei === 'None') ||
    (p.has_identifiers === false);

  const naics = arrLen(p.primary_naics) > 0;

  // Capabilities section is complete if:
  // - They explicitly said they have none (has_capabilities === false), OR
  // - They have at least 3 capabilities
  const capabilities =
    (p.has_capabilities === false) ||
    arrLen(p.capabilities) >= 3;

  // Experience section is complete if:
  // - They explicitly said they have no agencies (has_agencies === false), OR
  // - They have at least 1 agency
  const experience =
    (p.has_agencies === false) ||
    arrLen(p.past_performance_agencies) > 0;

  const preferences = arrLen(p.geographic_preferences) > 0;

  // Certifications section is complete if:
  // - They have at least one certification selected, OR
  // - They explicitly marked it as "None"
  const certifications =
    arrLen(p.set_aside_eligibilities) > 0 ||
    hasNoneValue(p.set_aside_eligibilities);

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