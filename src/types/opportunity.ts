/**
 * Location object structure for place of performance
 * All fields are optional and may be null
 */
export interface Location {
  country?: string | null;
  state?: string | null;
  city?: string | null;
  zip?: string | null;
}

export interface Opportunity {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  agency: string;
  description?: string;
  match_score: number;
  reasoning: string;
  status: OpportunityStatus;
  due_date?: string; // ISO date
  estimated_value?: string;
  matched_at: string; // ISO datetime
  opportunity_url?: string;
  set_aside?: string;
  // Location information
  place_of_performance?: Location;
  location?: string; // Backward compatibility - pre-formatted "City, State, Zip"
  // These fields come from the database schema but may be optional
  posted_date?: string;
  naics_code?: string;
  psc_code?: string;
  val_est_low?: string;
  val_est_high?: string;
}

export enum OpportunityStatus {
  NEW = 'new',
  SAVED = 'saved',
  PURSUING = 'pursuing',
  APPLIED = 'applied',
  PASSED = 'passed',
  WON = 'won',
  LOST = 'lost'
}

export interface OpportunityFilters {
  status?: OpportunityStatus;
  scoreMin?: number;
  scoreMax?: number;
  agency?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardStats {
  newToday: number;
  saved: number;
  pursuing: number;
  dueThisWeek: number;
  totalOpportunities: number;
  averageScore: number;
}