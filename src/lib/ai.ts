import { supabase } from './supabase';

export interface PostFacts {
  city: string;      // where the job was
  material: string;  // what was installed
  details?: string;  // anything special about it
}

export interface GeneratedPost {
  title_en: string; title_es: string;
  excerpt_en: string; excerpt_es: string;
  body_en: string; body_es: string;
  meta_description_en: string; meta_description_es: string;
  cover_alt_en: string; cover_alt_es: string;
  slug: string; city: string; county: string;
  materials: string[];
}

const FRIENDLY_FAIL =
  'The AI writer could not be reached. If this keeps happening, the writer may not be switched on yet — ask Angel.';

/**
 * Asks the server-side writer to draft a complete bilingual post
 * from a few facts about a real job. The API key never touches the browser.
 */
export async function generatePost(facts: PostFacts): Promise<GeneratedPost> {
  const { data, error } = await supabase.functions.invoke('generate-post', {
    body: { facts },
  });

  if (error) {
    // supabase-js wraps non-2xx responses; try to surface the function's own message.
    let msg = FRIENDLY_FAIL;
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) msg = body.error;
      }
    } catch { /* keep friendly default */ }
    throw new Error(msg);
  }

  if (data?.error) throw new Error(String(data.error));
  if (!data?.result?.title_en || !data?.result?.body_en) throw new Error(FRIENDLY_FAIL);
  return data.result as GeneratedPost;
}
