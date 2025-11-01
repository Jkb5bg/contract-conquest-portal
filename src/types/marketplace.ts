// Marketplace Type Definitions
// Based on the OpenAPI schema for the marketplace feature

export interface PortfolioItem {
  title: string;
  description: string;
  year?: number | null;
  client_type?: string | null;
  contract_value?: string | null;
  won?: boolean | null;
  link_url?: string | null;
}

export interface Testimonial {
  client_name: string;
  client_company?: string | null;
  rating: number; // 1-5
  review_text: string;
  date?: string | null;
  project_type?: string | null;
}

export interface ProposalWriterPublicProfile {
  writer_id: string;
  full_name: string;
  company_name?: string | null;
  profile_photo_url?: string | null;
  bio?: string | null;
  headline?: string | null;
  years_experience?: number | null;
  qualifications: string[];
  specializations: string[];
  portfolio_items: PortfolioItem[];
  testimonials: Testimonial[];
  pricing_model: string;
  price_range_display?: string | null;
  availability_status: string;
  response_time_hours: number;
  accepts_rush_projects: boolean;
  service_locations: string[];
  naics_expertise: string[];
  success_rate?: number | null;
  average_rating?: number | null;
  total_reviews: number;
  total_bookings: number;
  is_verified: boolean;
  is_featured: boolean;
}

export interface ProposalWriterRegistration {
  email: string;
  full_name: string;
  company_name?: string | null;
  phone?: string | null;
  years_experience?: number | null;
  brief_bio?: string | null;
  linkedin_url?: string | null;
  website_url?: string | null;
}

export interface ProposalWriterUpdateProfile {
  full_name?: string | null;
  company_name?: string | null;
  profile_photo_url?: string | null;
  bio?: string | null;
  headline?: string | null;
  qualifications?: string[] | null;
  specializations?: string[] | null;
  years_experience?: number | null;
  portfolio_items?: PortfolioItem[] | null;
  testimonials?: Testimonial[] | null;
  sample_proposals_url?: string | null;
  hourly_rate?: number | null;
  project_rate_min?: number | null;
  project_rate_max?: number | null;
  pricing_model?: string | null;
  pricing_notes?: string | null;
  availability_status?: string | null;
  response_time_hours?: number | null;
  accepts_rush_projects?: boolean | null;
  rush_fee_percentage?: number | null;
  service_locations?: string[] | null;
  naics_expertise?: string[] | null;
  agency_experience?: string[] | null;
}

export interface WriterLoginRequest {
  email: string;
  password: string;
}

export interface WriterLoginResponse {
  access_token: string;
  refresh_token: string;
  writer_id: string;
  email: string;
  is_password_temporary: boolean;
  message?: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export type ServiceType = 'proposal_writing' | 'consultation' | 'proposal_review' | 'strategy_session' | 'custom';

export interface ProposalWriterBookingRequest {
  writer_id: string;
  client_id: string;
  service_type: ServiceType;
  project_description: string;
  opportunity_id?: string | null;
  budget?: number | null;
  deadline?: string | null; // ISO date-time
  preferred_contact_method?: string | null;
}

export type ContactType = 'inquiry' | 'quote_request' | 'follow_up';

export interface ProposalWriterContactRequest {
  writer_id: string;
  client_id: string;
  subject?: string | null;
  message: string;
  contact_type?: ContactType;
  opportunity_id?: string | null;
}

export type BookingStatus = 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

export interface BookingStatusUpdate {
  booking_id: string;
  booking_status: BookingStatus;
  notes?: string | null;
}

export interface BookingReview {
  booking_id: string;
  rating: number; // 1-5
  review_text?: string | null;
}

export interface Booking {
  booking_id: string;
  writer_id: string;
  writer_name?: string;
  client_id: string;
  client_name?: string;
  service_type: ServiceType;
  project_description: string;
  opportunity_id?: string | null;
  budget?: number | null;
  deadline?: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  notes?: string | null;
  review?: BookingReview | null;

  // ⬇️ add any status timestamps your backend returns
  accepted_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
}


export interface MarketplaceFilters {
  limit?: number;
  offset?: number;
  specialization?: string | null;
  min_rating?: number | null;
  max_price?: number | null;
  availability?: string | null;
  naics_code?: string | null;
  featured_only?: boolean;
}

export type SubscriptionTier = 'starter' | 'pro';

export interface TierInfo {
  tier_name: SubscriptionTier;
  tier_level: number;
  features: string[];
  max_naics_codes: number;
  min_opportunity_score: number;
  contact_limit_monthly?: number | null;
  booking_limit_monthly?: number | null;
}

export interface MyTierInfo extends TierInfo {
  contacts_used_this_month: number;
  bookings_used_this_month: number;
  can_contact: boolean;
  can_book: boolean;
  naics_codes_used: number;
}

export interface BookingMessage {
  message_id: string;
  booking_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'client' | 'writer';
  message_text: string;
  created_at: string;
}

export interface BookingMessageCreate {
  booking_id: string;
  message_text: string;
}
