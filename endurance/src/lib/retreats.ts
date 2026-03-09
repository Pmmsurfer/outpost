/**
 * Accommodation / room type for a retreat (e.g. Single Queen Shared Bath).
 * Capacity and sold-out state drive availability.
 */
export interface AccommodationType {
  id: string;
  retreatId: string;
  name: string;
  capacity: number;
  bookedCount: number;
  priceCents: number;
  soldOut: boolean;
}

/**
 * Option for "which activities would you like?" (e.g. Yoga, Long hike).
 */
export interface ActivityOption {
  id: string;
  retreatId: string;
  label: string;
}

/**
 * Custom field the host defines per retreat (e.g. Phone, Instagram, Hiking experience).
 */
export interface CustomField {
  id: string;
  retreatId: string;
  label: string;
  required: boolean;
  type: "text" | "paragraph" | "select";
  options?: string[]; // for select
}

/**
 * Consent checkbox (e.g. deposit charge, policy link).
 */
export interface ConsentCheckbox {
  id: string;
  retreatId: string;
  label: string;
  required: boolean;
  policyUrl?: string;
}

/** Use Supabase or retreat-specific config when available; no mock data. */
export const mockAccommodationTypes: AccommodationType[] = [];
export const mockActivityOptions: ActivityOption[] = [];
export const mockCustomFields: CustomField[] = [];
export const mockConsentCheckboxes: ConsentCheckbox[] = [];
