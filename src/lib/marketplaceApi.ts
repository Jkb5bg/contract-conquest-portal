// Marketplace API Service
// API calls for marketplace functionality

import { apiClient } from './api';
import {
  ProposalWriterPublicProfile,
  ProposalWriterRegistration,
  ProposalWriterContactRequest,
  ProposalWriterBookingRequest,
  BookingReview,
  MarketplaceFilters,
  Booking,
  TierInfo,
  MyTierInfo,
} from '@/types/marketplace';

// ============================================================================
// PUBLIC MARKETPLACE ENDPOINTS (No auth required)
// ============================================================================

/**
 * Get list of all writers in marketplace with optional filters
 */
export async function getMarketplaceWriters(
  filters?: MarketplaceFilters
): Promise<ProposalWriterPublicProfile[]> {
  const response = await apiClient.get('/marketplace/writers', { params: filters });
  return response.data;
}

/**
 * Get public profile for a specific writer
 */
export async function getWriterProfile(writerId: string): Promise<ProposalWriterPublicProfile> {
  const response = await apiClient.get(`/marketplace/writers/${writerId}`);
  return response.data;
}

/**
 * Register as a new proposal writer
 */
export async function registerWriter(data: ProposalWriterRegistration) {
  const response = await apiClient.post('/marketplace/writers/register', data);
  return response.data;
}

/**
 * Get available subscription tiers
 */
export async function getAvailableTiers(): Promise<TierInfo[]> {
  const response = await apiClient.get('/marketplace/tiers');
  return response.data;
}

/**
 * Get available specializations
 */
export async function getAvailableSpecializations(): Promise<string[]> {
  const response = await apiClient.get('/marketplace/search/specializations');
  return response.data;
}

/**
 * Search NAICS codes
 */
export async function searchNaicsCodes(query: string): Promise<any[]> {
  const response = await apiClient.get('/marketplace/search/naics-codes', {
    params: { query },
  });
  return response.data;
}

// ============================================================================
// CLIENT MARKETPLACE ENDPOINTS (Requires client auth)
// ============================================================================

/**
 * Contact a writer (send inquiry)
 */
export async function contactWriter(data: ProposalWriterContactRequest) {
  const response = await apiClient.post('/marketplace/contact', data);
  return response.data;
}

/**
 * Create a booking request
 */
export async function createBooking(data: ProposalWriterBookingRequest) {
  const response = await apiClient.post('/marketplace/bookings', data);
  return response.data;
}

/**
 * Get my bookings as a client
 */
export async function getMyBookings(limit: number = 50): Promise<Booking[]> {
  const response = await apiClient.get('/marketplace/bookings/my-bookings', {
    params: { limit },
  });
  return response.data;
}

/**
 * Submit a review for a completed booking
 */
export async function submitBookingReview(bookingId: string, review: BookingReview) {
  const response = await apiClient.post(`/marketplace/bookings/${bookingId}/review`, review);
  return response.data;
}

/**
 * Get current user's tier information and usage
 */
export async function getMyTierInfo(): Promise<MyTierInfo> {
  const response = await apiClient.get('/marketplace/my-tier');
  return response.data;
}
