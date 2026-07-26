import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { BusinessSettings } from './types';

export function useSettings() {
  const [s, setS] = useState<BusinessSettings | null>(null);
  useEffect(() => {
    supabase.from('business_settings').select('*').maybeSingle()
      .then(({ data }) => setS((data as BusinessSettings) ?? null));
  }, []);
  return s;
}
