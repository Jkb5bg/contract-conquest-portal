/**
 * Location utility functions for consistent formatting across the application
 * Handles the new Location object structure and backward compatibility
 */

import { Location } from '@/types/opportunity';

/**
 * Format a Location object to a human-readable string
 * Handles optional fields gracefully
 *
 * Examples:
 * - { city: "Bristol", state: "VA", zip: "24201" } => "Bristol, VA 24201"
 * - { city: "Bristol", state: "VA" } => "Bristol, VA"
 * - { state: "VA" } => "VA"
 * - {} => "Location not specified"
 */
export function formatLocation(location?: Location | null): string {
  if (!location) {
    return 'Location not specified';
  }

  const { city, state, zip } = location;
  const parts: string[] = [];

  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);

  if (parts.length === 0) {
    return 'Location not specified';
  }

  // For "City, State Zip" format
  if (parts.length === 3) {
    return `${parts[0]}, ${parts[1]} ${parts[2]}`;
  }
  // For "City, State" format
  if (parts.length === 2 && city) {
    return `${parts[0]}, ${parts[1]}`;
  }
  // For just the parts we have
  return parts.join(', ');
}

/**
 * Get the state abbreviation from a Location object
 * Useful for filtering and display
 */
export function getLocationState(location?: Location | null): string | null | undefined {
  return location?.state;
}

/**
 * Get the city from a Location object
 */
export function getLocationCity(location?: Location | null): string | null | undefined {
  return location?.city;
}

/**
 * Get the zip code from a Location object
 */
export function getLocationZip(location?: Location | null): string | null | undefined {
  return location?.zip;
}

/**
 * Get the country from a Location object (defaults to "USA" if not specified)
 */
export function getLocationCountry(location?: Location | null): string {
  return location?.country || 'USA';
}

/**
 * Check if a location has any non-null fields
 */
export function hasLocationData(location?: Location | null): boolean {
  if (!location) return false;
  return !!(location.city || location.state || location.zip || location.country);
}

/**
 * Compare two locations for equality
 */
export function locationsEqual(loc1?: Location | null, loc2?: Location | null): boolean {
  if (!loc1 && !loc2) return true;
  if (!loc1 || !loc2) return false;

  return (
    loc1.city === loc2.city &&
    loc1.state === loc2.state &&
    loc1.zip === loc2.zip &&
    loc1.country === loc2.country
  );
}

/**
 * Extract location from opportunity data
 * Falls back to pre-formatted location string for backward compatibility
 */
export function getOpportunityLocation(data: {
  place_of_performance?: Location | null;
  location?: string;
}): string {
  // Prefer the new structured location object
  if (data.place_of_performance) {
    const formatted = formatLocation(data.place_of_performance);
    if (formatted !== 'Location not specified') {
      return formatted;
    }
  }

  // Fall back to pre-formatted location string from backend
  if (data.location) {
    return data.location;
  }

  return 'Location not specified';
}