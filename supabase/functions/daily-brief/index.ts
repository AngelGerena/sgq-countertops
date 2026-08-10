// Supabase Edge Function: daily-brief
// The Office Manager agent. Reads what already happened in the business
// (requests, quotes, jobs, blog drafts), notices what is going stale, and
// composes one short bilingual brief for the owner: what happened, what the
// assistant noticed, and the few things only the owner can decide.
//
// Level 0 — observer. It reports. It never touches records, money or customers.
//
// Two ways to call it:
//   1. From the portal (signed-in admin presses "Get today's brief").
//   2. On a schedule (cron) with header  x-cron-secret: <CRON_SECRET>
//      — this also emails the brief to the owner when RESEND_API_KEY is set.
//
// Deploy:   supabase functions deploy daily-brief
// Secrets:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...          (required for the friendly voice)
//           supabase secrets set CRON_SECRET=<any-long-random-string>  (only for scheduled runs)
//           supabase secrets set RESEND_API_KEY=re_...                 (optional, for the morning email)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};

const DAY = 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are the Office Manager for Santiago's Granite & Quartz, a family-run
countertop fabricator in Central Florida owned by Cesar Santiago. Once a day you hand Cesar a short
brief about his business. He is not technical. He is busy. He trusts you to be straight with him.

Voice: warm, plain-spoken, like a trusted assistant who has worked with him for years. Short sentences.
No corporate words, no tech words, no emoji. Spanish version is natural Latin-American Spanish, not a
literal translation.

Rules:
- Use ONLY the facts provided. Never invent numbers, names, or events. If a section has nothing, skip it.
- Lead with what needs Cesar's decision, not with statistics.
- At most THREE asks. Each ask is one sentence, concrete, and says why it matters.
- Keep the whole brief under 150 words per language.
- If genuinely nothing needs attention, say so warmly in two sentences — never pad.

Return ONLY a JSON object — no preamble, no markdown fences — matching exactly:
{
  "brief_en": string,
  "brief_es": string,
  "asks": [ { "text_en": string, "text_es": string, "link": string } ]
}
"link" must be one of: "/admin/leads", "/admin/quotes", "/admin/jobs", "/admin/blog", or "" when no page fits.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    const isCron = !!cronSecret && req.headers.get('x-cron-secret') === cronSecret;

    // Service client for cron runs; user-scoped client for portal runs.
    const url = Deno.env.get('SUPABASE_URL')!;
    let db;
    let userId: string | null = null;

    if (isCron) {
      db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    } else {
      const auth = req.headers.get('Authorization');
      if (!auth) return json({ error: 'Not signed in.' }, 401);
      db = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: auth } },
      });
      const { data: { user } } = await db.auth.getUser();
      if (!user) return json({ error: 'Not signed in.' }, 401);
      const { data: admin } = await db
        .from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
      if (!admin) return json({ error: 'Not authorized.' }, 403);
      userId = user.id;
    }

    // The agent must exist and be enabled — the master switch.
    const { data: agent } = await db
      .from('agents').select('id, enabled').eq('role', 'office_manager').maybeSingle();
    if (!agent) return json({ error: 'The assistant is not set up yet. Run migration 04 first.' }, 503);
    if (!agent.enabled) return json({ error: 'The assistant is switched off in Settings.' }, 503);

    // ---- Perception: read what actually happened ---------------------------
    const now = Date.now();
    const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

    const [leads24, leadsWaiting, quotesStale, installsSoon, balances, drafts] = await Promise.all([
      db.from('leads').select('id, name, city, created_at')
        .gte('created_at', iso(DAY)).is('deleted_at', null),
      db.from('leads').select('id, name, city, created_at')
        .eq('status', 'new').lt('created_at', iso(2 * DAY)).is('deleted_at', null).limit(10),
      db.from('quotes').select('id, quote_number, total, updated_at')
        .eq('status', 'sent').lt('updated_at', iso(3 * DAY)).is('deleted_at', null).limit(10),
      db.from('jobs').select('id, job_number, city, install_date')
        .eq('status', 'scheduled')
        .gte('install_date', new Date(now).toISOString().slice(0, 10))
        .lte('install_date', new Date(now + 7 * DAY).toISOString().slice(0, 10))
        .is('deleted_at', null),
      db.from('jobs').select('id, job_number, balance_due')
        .in('status', ['installed', 'complete']).gt('balance_due', 0).is('deleted_at', null).limit(10),
      db.from('posts').select('id, title_en')
        .eq('status', 'draft').is('deleted_at', null).limit(5),
    ]);

    const facts = {
      date: new Date(now).toISOString().slice(0, 10),
      new_requests_last_24h: (leads24.data ?? []).map(l => ({ name: l.name, city: l.city })),
      requests_waiting_over_2_days: (leadsWaiting.data ?? []).map(l => ({ name: l.name, city: l.city })),
      quotes_sent_no_answer_3_days: (quotesStale.data ?? []).map(q => ({
        number: q.quote_number, total: Number(q.total || 0),
      })),
      installs_next_7_days: (installsSoon.data ?? []).map(j => ({
        number: j.job_number, city: j.city, date: j.install_date,
      })),
      finished_jobs_with_money_owed: (balances.data ?? []).map(j => ({
        number: j.job_number, owed: Number(j.balance_due || 0),
      })),
      blog_drafts_waiting: (drafts.data ?? []).map(p => p.title_en),
    };

    // Record what the manager noticed as events (observer memory).
    const noticed: { kind: string; source_id: string | null; payload: unknown }[] = [];
    for (const q of quotesStale.data ?? []) {
      noticed.push({ kind: 'quote_stale', source_id: q.id, payload: { number: q.quote_number, total: q.total } });
    }
    for (const l of leadsWaiting.data ?? []) {
      noticed.push({ kind: 'lead_waiting', source_id: l.id, payload: { name: l.name, city: l.city } });
    }
    for (const j of balances.data ?? []) {
      noticed.push({ kind: 'balance_outstanding', source_id: j.id, payload: { number: j.job_number, owed: j.balance_due } });
    }
    if (noticed.length) {
      await db.from('agent_events').insert(noticed.map(n => ({
        ...n, payload: n.payload as Record<string, unknown>,
        handled_by: agent.id, handled_at: new Date().toISOString(),
      })));
    }

    // ---- Reasoning: compose the brief --------------------------------------
    const key = Deno.env.get('ANTHROPIC_API_KEY');
    let brief: { brief_en: string; brief_es: string; asks: { text_en: string; text_es: string; link: string }[] };
    let tokensIn: number | null = null;
    let tokensOut: number | null = null;
    // 'ai' when the model wrote it; anything else names the reason it did not,
    // so a quietly-degraded assistant is visible in the run log instead of
    // looking like a normal day.
    let composedBy = 'ai';

    if (key) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 2500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: 'Here is today\'s data:\n' + JSON.stringify(facts) }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('anthropic error', res.status, body);
        composedBy = `fallback:http_${res.status}`;
        brief = mechanicalBrief(facts);
      } else {
        const data = await res.json();
        tokensIn = data.usage?.input_tokens ?? null;
        tokensOut = data.usage?.output_tokens ?? null;
        const text = (data.content ?? [])
          .filter((b: { type: string }) => b.type === 'text')
          .map((b: { text: string }) => b.text).join('\n');
        const parsed = safeJson(text);
        if (parsed && parsed.brief_en) {
          brief = parsed as typeof brief;
        } else {
          console.error('brief JSON unparseable, first 400 chars:', text.slice(0, 400));
          composedBy = 'fallback:unparseable';
          brief = mechanicalBrief(facts);
        }
      }
    } else {
      // No key yet — the assistant still works, just plainer.
      composedBy = 'fallback:no_key';
      brief = mechanicalBrief(facts);
    }

    // ---- Memory: narrate the run --------------------------------------------
    const { data: run } = await db.from('agent_runs').insert({
      agent_id: agent.id,
      decision: 'acted',
      narrative: brief.brief_en,
      detail: { ...brief, stats: summarize(facts), via: isCron ? 'schedule' : 'portal', composed_by: composedBy },
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    }).select('id, created_at').single();

    if (tokensIn !== null) {
      await db.from('ai_runs').insert({
        kind: 'daily_brief', created_by: userId,
        input_tokens: tokensIn, output_tokens: tokensOut,
      });
    }

    // ---- Delivery: the morning email (cron runs only, optional) -------------
    if (isCron) await maybeEmail(db, brief);

    return json({ result: { ...brief, stats: summarize(facts), composed_by: composedBy, run_id: run?.id ?? null, generated_at: run?.created_at ?? new Date().toISOString() } });
  } catch (e) {
    console.error(e);
    return json({ error: 'Something went wrong preparing the brief.' }, 500);
  }
});

// A brief with no AI: plain, mechanical, still useful. The assistant never
// shows a dead screen because a key is missing.
function mechanicalBrief(f: {
  new_requests_last_24h: { name: string; city: string | null }[];
  requests_waiting_over_2_days: { name: string; city: string | null }[];
  quotes_sent_no_answer_3_days: { number: string | null; total: number }[];
  installs_next_7_days: { number: string | null; city: string | null; date: string | null }[];
  finished_jobs_with_money_owed: { number: string | null; owed: number }[];
  blog_drafts_waiting: (string | null)[];
}) {
  const en: string[] = [];
  const es: string[] = [];
  const asks: { text_en: string; text_es: string; link: string }[] = [];

  if (f.new_requests_last_24h.length) {
    en.push(`${f.new_requests_last_24h.length} new request${f.new_requests_last_24h.length > 1 ? 's' : ''} came in over the last day.`);
    es.push(`${f.new_requests_last_24h.length} solicitud${f.new_requests_last_24h.length > 1 ? 'es nuevas llegaron' : ' nueva llegó'} en el último día.`);
  }
  if (f.installs_next_7_days.length) {
    en.push(`${f.installs_next_7_days.length} install${f.installs_next_7_days.length > 1 ? 's are' : ' is'} scheduled in the next 7 days.`);
    es.push(`${f.installs_next_7_days.length} instalación${f.installs_next_7_days.length > 1 ? 'es programadas' : ' programada'} en los próximos 7 días.`);
  }
  if (f.quotes_sent_no_answer_3_days.length) {
    const total = f.quotes_sent_no_answer_3_days.reduce((a, q) => a + q.total, 0);
    asks.push({
      text_en: `${f.quotes_sent_no_answer_3_days.length} quote(s) worth about $${Math.round(total).toLocaleString()} have had no answer for 3+ days — a quick call could win them.`,
      text_es: `${f.quotes_sent_no_answer_3_days.length} cotización(es) por unos $${Math.round(total).toLocaleString()} llevan 3+ días sin respuesta — una llamada rápida podría ganarlas.`,
      link: '/admin/quotes',
    });
  }
  if (f.requests_waiting_over_2_days.length) {
    asks.push({
      text_en: `${f.requests_waiting_over_2_days.length} request(s) have been waiting more than 2 days without a reply.`,
      text_es: `${f.requests_waiting_over_2_days.length} solicitud(es) llevan más de 2 días sin respuesta.`,
      link: '/admin/leads',
    });
  }
  if (f.finished_jobs_with_money_owed.length) {
    const owed = f.finished_jobs_with_money_owed.reduce((a, j) => a + j.owed, 0);
    asks.push({
      text_en: `About $${Math.round(owed).toLocaleString()} is still owed on finished jobs.`,
      text_es: `Todavía se deben unos $${Math.round(owed).toLocaleString()} de trabajos terminados.`,
      link: '/admin/jobs',
    });
  }
  if (!en.length && !asks.length) {
    en.push('All quiet. Nothing needs your attention today.');
    es.push('Todo tranquilo. Nada necesita tu atención hoy.');
  }
  return { brief_en: en.join(' '), brief_es: es.join(' '), asks: asks.slice(0, 3) };
}

function summarize(f: Record<string, unknown>) {
  const len = (k: string) => (Array.isArray(f[k]) ? (f[k] as unknown[]).length : 0);
  return {
    new_requests: len('new_requests_last_24h'),
    waiting_requests: len('requests_waiting_over_2_days'),
    stale_quotes: len('quotes_sent_no_answer_3_days'),
    installs_soon: len('installs_next_7_days'),
    jobs_owed: len('finished_jobs_with_money_owed'),
    blog_drafts: len('blog_drafts_waiting'),
  };
}

// deno-lint-ignore no-explicit-any
async function maybeEmail(db: any, brief: { brief_en: string; brief_es: string; asks: { text_en: string; link: string }[] }) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!resendKey) return;
  try {
    const { data: s } = await db.from('business_settings').select('email, trade_name').maybeSingle();
    if (!s?.email) return;
    const asksHtml = brief.asks.length
      ? '<ul>' + brief.asks.map(a => `<li>${escapeHtml(a.text_en)}</li>`).join('') + '</ul>'
      : '';
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: 'Your assistant <onboarding@resend.dev>',
        to: [s.email],
        subject: `Your daily brief — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        html: `<p>${escapeHtml(brief.brief_en)}</p>${asksHtml}<p style="color:#888">— your assistant at ${escapeHtml(s.trade_name ?? 'the portal')}</p>`,
      }),
    });
  } catch (e) {
    console.error('email skipped', e);
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function safeJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf('{'); const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
  return null;
}
