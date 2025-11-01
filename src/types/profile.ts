export type SubscriptionTier = 'starter' | 'pro';

export interface ClientProfile {
  client_id: string;
  company_name: string;
  email: string;
  primary_naics: string[];
  secondary_naics: string[];
  cage_code?: string;
  uei?: string;
  capabilities: string[];
  past_performance_agencies: string[];
  contract_value_range: {
    min: number;
    max: number;
  };
  geographic_preferences: string[];
  set_aside_eligibilities: string[];
  active: boolean;
  subscription_tier?: SubscriptionTier;
}

export interface ProfileCompleteness {
  overall: number;
  sections: {
    basic: boolean;
    identifiers: boolean;
    capabilities: boolean;
    experience: boolean;
    preferences: boolean;
    certifications: boolean;
  };
  missingFields: string[];
  recommendations: string[];
}