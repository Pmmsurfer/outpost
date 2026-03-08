/**
 * Types for retreat creation form and retreats table in Supabase.
 */

export type ActivityType = "surf" | "yoga" | "hiking" | "multi-sport" | "other";
export type SkillLevel = "all-levels" | "beginner" | "intermediate" | "advanced";
export type CancellationPolicy = "flexible" | "moderate" | "strict";
export type DepositType = "flat" | "percent";

export interface RetreatFaq {
  question: string;
  answer: string;
}

export interface RetreatFormData {
  name: string;
  activity_type: ActivityType;
  location_city: string;
  location_country: string;
  start_date: string;
  end_date: string;
  capacity: string;
  contact_email: string;
  short_description: string;
  full_description: string;
  included: string[];
  not_included: string[];
  skill_level: SkillLevel;
  typical_day: string;
  accommodation_notes: string;
  highlights: string[];
  faqs: RetreatFaq[];
  price: string;
  currency: string;
  deposit_amount: string;
  deposit_type: DepositType;
  balance_due_days: string;
  cancellation_policy: CancellationPolicy;
  policy_liability_waiver: boolean;
  policy_travel_insurance: boolean;
  policy_age_requirement: boolean;
  policy_age_min: string;
  policy_custom: boolean;
  policy_custom_text: string;
  waiver_required: boolean;
  waiver_text: string;
  cover_image_url: string;
  gallery_urls: string[];
  status: "draft" | "published";
}

export const defaultFormData: RetreatFormData = {
  name: "",
  activity_type: "yoga",
  location_city: "",
  location_country: "",
  start_date: "",
  end_date: "",
  capacity: "",
  contact_email: "",
  short_description: "",
  full_description: "",
  included: [],
  not_included: [],
  skill_level: "all-levels",
  typical_day: "",
  accommodation_notes: "",
  highlights: [],
  faqs: [],
  price: "",
  currency: "USD",
  deposit_amount: "",
  deposit_type: "flat",
  balance_due_days: "",
  cancellation_policy: "moderate",
  policy_liability_waiver: false,
  policy_travel_insurance: false,
  policy_age_requirement: false,
  policy_age_min: "",
  policy_custom: false,
  policy_custom_text: "",
  waiver_required: false,
  waiver_text: "",
  cover_image_url: "",
  gallery_urls: [],
  status: "draft",
};
