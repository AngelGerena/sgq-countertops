// Supabase Edge Function: generate-post
// Writes a complete bilingual, SEO-ready blog post from a few facts about a real job.
// The Anthropic API key lives in Supabase secrets — it NEVER reaches the browser.
//
// Deploy:   supabase functions deploy generate-post
// Secret:   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are the content writer for Santiago's Granite & Quartz (SGQ Countertops),
a family-run granite and quartz countertop fabricator and installer serving Central Florida
(Volusia, Seminole, Orange, Lake counties — towns like DeBary, Deltona, DeLand, Sanford, Orange City, Lake Mary).
The owner is Cesar Santiago. The voice is warm, plain-spoken, proud of craftsmanship, never salesy or corporate.

You write ONE blog post about ONE real job, in the style of a local craftsman telling the story of the work:
what the kitchen (or bath) was like before, what stone was chosen and why, how the install went, and how it turned out.
Keep it grounded ONLY in the facts provided. NEVER invent prices, warranties, timelines, customer names, or details
that were not given. If a detail is missing, simply do not mention it.

Writing rules:
- Body is Markdown: use ## for 2-3 short section headings, short paragraphs, at most one short list.
- 350-500 words for the English body. Natural, human, specific. No emoji. No hype words like "stunning" more than once.
- Naturally include the town name and the material a few times — that is what homeowners search for.
- End the body with a one-sentence friendly invitation to request a free quote (no phone numbers, no prices).
- Spanish versions are natural Latin-American Spanish, not literal translations.
- meta descriptions: max 155 characters, include town + material.
- slug: lowercase, hyphenated, includes town and material, max 60 chars.
- county: infer the correct Central Florida county from the town; if unsure, leave it as an empty string.
- cover_alt: describe a realistic photo of the finished work (one sentence).

Return ONLY a JSON object — no preamble, no markdown fences — matching exactly:
{
  "title_en": string, "title_es": string,
  "excerpt_en": string, "excerpt_es": string,
  "body_en": string, "body_es": string,
  "meta_description_en": string, "meta_description_es": string,
  "cover_alt_en": string, "cover_alt_es": string,
  "slug": string, "city": string, "county": string,
  "materials": string[]
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // 1. Authenticate — never let an anonymous caller spend tokens.
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Not signed in.' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Not signed in.' }, 401);

    const { data: admin } = await supabase
      .from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
    if (!admin) return json({ error: 'Not authorized.' }, 403);

    // 2. Read and sanity-check the facts.
    const { facts } = await req.json().catch(() => ({ facts: null }));
    if (!facts || typeof facts !== 'object' || !String(facts.city ?? '').trim() || !String(facts.material ?? '').trim()) {
      return json({ error: 'Tell me the town and the stone first.' }, 400);
    }

    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) return json({ error: 'The AI writer is not switched on yet. Ask Angel to finish the setup.' }, 503);

    const userMsg = [
      `Town / city: ${String(facts.city).slice(0, 120)}`,
      `What was installed: ${String(facts.material).slice(0, 300)}`,
      facts.details ? `Extra details from the owner: ${String(facts.details).slice(0, 1200)}` : '',
      `Today's date: ${new Date().toISOString().slice(0, 10)}`,
    ].filter(Boolean).join('\n');

    // 3. Call the model. max_tokens always capped.
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('anthropic error', res.status, detail);
      return json({ error: 'The writer is unavailable right now. Try again in a minute.' }, 502);
    }

    const data = await res.json();
    const text = (data.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text).join('\n');

    // 4. Parse defensively — models sometimes wrap JSON in fences.
    const parsed = safeJson(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.title_en || !parsed.body_en) {
      console.error('unparseable model output', text.slice(0, 400));
      return json({ error: 'The writer got confused. Try once more.' }, 502);
    }

    // 5. Log usage so cost stays visible. Fire-and-forget.
    await supabase.from('ai_runs').insert({
      kind: 'blog_post',
      created_by: user.id,
      input_tokens: data.usage?.input_tokens ?? null,
      output_tokens: data.usage?.output_tokens ?? null,
    });

    return json({ result: parsed });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong generating that.' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function safeJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  // Last resort: grab the outermost braces.
  const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
  return null;
}
