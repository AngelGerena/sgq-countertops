import { supabase } from './supabase';

// The agent layer, Sprint 1: the Office Manager and its Daily Brief.
// Level 0 — it watches and reports. It never touches records, money or customers.

export interface BriefAsk {
  text_en: string;
  text_es: string;
  link: string; // '/admin/quotes' etc., or '' when no page fits
}

export interface DailyBrief {
  brief_en: string;
  brief_es: string;
  asks: BriefAsk[];
  stats: {
    new_requests: number;
    waiting_requests: number;
    stale_quotes: number;
    installs_soon: number;
    jobs_owed: number;
    blog_drafts: number;
  };
  run_id: string | null;
  generated_at: string;
}

export interface AgentRunRow {
  id: string;
  decision: 'acted' | 'drafted' | 'escalated' | 'ignored';
  narrative: string;
  detail: (Partial<DailyBrief> & { via?: string }) | null;
  created_at: string;
}

export interface AgentRow {
  id: string;
  role: string;
  display_en: string;
  display_es: string;
  autonomy: number;
  enabled: boolean;
}

const FRIENDLY_FAIL =
  'The assistant could not be reached. If this keeps happening, it may not be switched on yet — ask Angel.';

/** Ask the Office Manager for today's brief. Composed server-side; key never in the browser. */
export async function getDailyBrief(): Promise<DailyBrief> {
  const { data, error } = await supabase.functions.invoke('daily-brief', { body: {} });
  if (error) {
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
  if (!data?.result?.brief_en) throw new Error(FRIENDLY_FAIL);
  return data.result as DailyBrief;
}

/** The activity log — everything the staff did, in plain English. */
export async function listRecentRuns(limit = 14): Promise<AgentRunRow[]> {
  const { data, error } = await supabase
    .from('agent_runs')
    .select('id, decision, narrative, detail, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AgentRunRow[];
}

/** The staff roster (Sprint 1: just the Office Manager). */
export async function getOfficeManager(): Promise<AgentRow | null> {
  const { data, error } = await supabase
    .from('agents')
    .select('id, role, display_en, display_es, autonomy, enabled')
    .eq('role', 'office_manager')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as AgentRow) ?? null;
}
