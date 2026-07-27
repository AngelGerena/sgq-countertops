export type Lang = 'en' | 'es';

export interface AdminUser {
  id: string; user_id: string; email: string;
  full_name: string | null; role: 'admin' | 'staff'; is_super_admin: boolean;
}

export interface SiteContentRow {
  key: string; section: string; label: string; hint: string | null;
  kind: 'text' | 'longtext' | 'image' | 'url';
  value_en: string | null; value_es: string | null; sort_order: number;
}

export interface BusinessSettings {
  legal_name: string; trade_name: string; license_number: string | null;
  address: string | null; phone: string | null; email: string | null;
  service_area: string | null; hours: string | null; review_url: string | null;
  deposit_pct: number; tax_rate: number;
  accept_card: boolean; accept_ach: boolean; ach_discount_pct: number;
}

export type LeadStatus = 'new' | 'contacted' | 'measured' | 'quoted' | 'won' | 'lost';
export interface Lead {
  id: string; customer_id: string | null;
  name: string; email: string | null; phone: string | null; city: string | null;
  source: 'website' | 'referral' | 'facebook' | 'google' | 'walk_in' | 'other';
  message: string | null; status: LeadStatus; lost_reason: string | null;
  is_demo: boolean; deleted_at: string | null;
  created_at: string; updated_at: string;
}

export interface Customer {
  id: string; name: string; email: string | null; phone: string | null;
  address: string | null; city: string | null; zip: string | null;
  lang: Lang; notes: string | null;
  is_demo: boolean; deleted_at: string | null;
  created_at: string; updated_at: string;
}

export type MaterialKind = 'stone' | 'cabinet' | 'edge' | 'adder';
export type MaterialUnit = 'sqft' | 'linear_ft' | 'each';
export interface Material {
  id: string; kind: MaterialKind; name: string;
  supplier: string | null; tier: string | null;
  unit: MaterialUnit; unit_price: number; cost: number | null;
  description_en: string | null; description_es: string | null;
  swatch_path: string | null; is_active: boolean; sort_order: number;
  deleted_at: string | null;
}

export interface TravelZone {
  id: string; name: string; uplift_pct: number; notes: string | null; is_active: boolean;
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
export interface Quote {
  id: string; quote_number: string | null;
  customer_id: string | null; lead_id: string | null; travel_zone_id: string | null;
  status: QuoteStatus;
  subtotal: number; travel_uplift: number; tax: number; total: number; deposit_due: number;
  valid_until: string | null; notes: string | null;
  is_demo: boolean; deleted_at: string | null;
  created_at: string; updated_at: string;
}

export interface QuoteItem {
  id: string; quote_id: string; material_id: string | null;
  label: string; qty: number; unit: string; unit_price: number;
  line_total: number; sort_order: number;
}

export type JobStatus = 'sold' | 'template' | 'fabrication' | 'scheduled' | 'installed' | 'complete' | 'on_hold';
export interface Job {
  id: string; job_number: string | null;
  customer_id: string | null; quote_id: string | null;
  status: JobStatus; address: string | null; city: string | null;
  install_date: string | null;
  contract_total: number; deposit_paid: number; balance_due: number;
  notes: string | null;
  is_demo: boolean; deleted_at: string | null;
  created_at: string; updated_at: string;
}
