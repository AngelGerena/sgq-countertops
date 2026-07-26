import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from './supabase';
import type { Lang, SiteContentRow } from './types';

/* Override-with-fallback.
   t('hero.headline', 'Measured twice.') returns the row's value when one exists,
   and the hardcoded default when it does not. Clearing a field in the admin
   restores the default rather than blanking the site. */
interface ContentShape {
  rows: SiteContentRow[];
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallbackEn: string, fallbackEs?: string) => string;
  reload: () => Promise<void>;
}

const Ctx = createContext<ContentShape>({
  rows: [], lang: 'en', setLang: () => {},
  t: (_k, f) => f, reload: async () => {}
});

export const useContent = () => useContext(Ctx);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<SiteContentRow[]>([]);
  const [lang, setLang] = useState<Lang>('en');

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_content')
      .select('key,section,label,hint,kind,value_en,value_es,sort_order')
      .order('section').order('sort_order');
    if (error) { console.error('site_content load failed:', error.message); return; }
    setRows((data as SiteContentRow[]) ?? []);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const t = useCallback((key: string, fallbackEn: string, fallbackEs?: string) => {
    const row = rows.find(r => r.key === key);
    const override = lang === 'es' ? row?.value_es : row?.value_en;
    if (override && override.trim() !== '') return override;
    return lang === 'es' ? (fallbackEs ?? fallbackEn) : fallbackEn;
  }, [rows, lang]);

  return <Ctx.Provider value={{ rows, lang, setLang, t, reload }}>{children}</Ctx.Provider>;
}
