export type Lang = 'en' | 'es';

export interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff';
  is_super_admin: boolean;
}

export interface SiteContentRow {
  key: string;
  section: string;
  label: string;
  hint: string | null;
  kind: 'text' | 'longtext' | 'image' | 'url';
  value_en: string | null;
  value_es: string | null;
  sort_order: number;
}

export interface BusinessSettings {
  legal_name: string;
  trade_name: string;
  license_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  service_area: string | null;
  hours: string | null;
  review_url: string | null;
  deposit_pct: number;
  tax_rate: number;
  accept_card: boolean;
  accept_ach: boolean;
  ach_discount_pct: number;
}
