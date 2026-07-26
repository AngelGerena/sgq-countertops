import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Counts { leads: number; quotes: number; jobs: number; }

export default function Dashboard() {
  const [c, setC] = useState<Counts | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const q = (t: string) => supabase.from(t).select('*', { count: 'exact', head: true });
      const [l, qu, j] = await Promise.all([q('leads'), q('quotes'), q('jobs')]);
      const bad = l.error || qu.error || j.error;
      if (bad) { setErr(bad.message); return; }
      setC({ leads: l.count ?? 0, quotes: qu.count ?? 0, jobs: j.count ?? 0 });
    })();
  }, []);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Dashboard</h1>
        <p>Where the business stands right now.</p>
      </header>
      {err && <div className="notice">{err}</div>}
      <div className="stat-grid">
        <div className="stat"><span className="stat-n">{c?.leads ?? '—'}</span><span className="stat-l">Leads</span></div>
        <div className="stat"><span className="stat-n">{c?.quotes ?? '—'}</span><span className="stat-l">Quotes</span></div>
        <div className="stat"><span className="stat-n">{c?.jobs ?? '—'}</span><span className="stat-l">Jobs</span></div>
      </div>
    </div>
  );
}
