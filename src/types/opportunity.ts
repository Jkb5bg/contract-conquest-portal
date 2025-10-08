export interface Opportunity {
  id: string;
  opportunity_id: string;
  client_id: string;
  match_score: number;
  reasoning: string;
  opportunity_title: string;
  agency: string;
  due_date: string | null;
  estimated_value: string | null;
  matched_at: string;
  status: OpportunityStatus;
  naics_code?: string;
  set_aside?: string;
  description?: string;
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
