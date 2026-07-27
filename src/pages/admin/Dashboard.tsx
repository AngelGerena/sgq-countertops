import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/money';

interface Stats {
  newLeads: number; openJobs: number; quotesOut: number;
  pipeline: number; outstanding: number; leadsThisMonth: number;
}

export default function Dashboard() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1); monthStart.setHours(0,0,0,0);

      const [leadsNew, leadsMonth, quotesSent, jobsOpen] = await Promise.all([
        supabase.from('leads').select('id', { count:'exact', head:true })
          .eq('status','new').is('deleted_at', null),
        supabase.from('leads').select('id', { count:'exact', head:true })
          .gte('created_at', monthStart.toISOString()).is('deleted_at', null),
        supabase.from('quotes').select('total').eq('status','sent').is('deleted_at', null),
        supabase.from('jobs').select('balance_due').neq('status','complete').is('deleted_at', null),
      ]);

      const bad = leadsNew.error || leadsMonth.error || quotesSent.error || jobsOpen.error;
      if (bad) { setErr(bad.message); return; }

      const pipeline = ((quotesSent.data as {total:number}[]) ?? [])
        .reduce((a,q) => a + Number(q.total || 0), 0);
      const outstanding = ((jobsOpen.data as {balance_due:number}[]) ?? [])
        .reduce((a,j) => a + Number(j.balance_due || 0), 0);

      setS({
        newLeads: leadsNew.count ?? 0,
        leadsThisMonth: leadsMonth.count ?? 0,
        quotesOut: (quotesSent.data ?? []).length,
        openJobs: (jobsOpen.data ?? []).length,
        pipeline, outstanding
      });
    })();
  }, []);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Today</h1>
        <p>Where the business stands right now.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="stat-grid">
        <Link className="stat linkable" to="/admin/leads">
          <span className="stat-n">{s?.newLeads ?? '—'}</span>
          <span className="stat-l">New requests</span>
        </Link>
        <Link className="stat linkable" to="/admin/quotes">
          <span className="stat-n">{s?.quotesOut ?? '—'}</span>
          <span className="stat-l">Quotes waiting</span>
        </Link>
        <Link className="stat linkable" to="/admin/jobs">
          <span className="stat-n">{s?.openJobs ?? '—'}</span>
          <span className="stat-l">Jobs in progress</span>
        </Link>
      </div>

      <div className="stat-grid wide">
        <div className="stat">
          <span className="stat-n sm">{s ? money(s.pipeline) : '—'}</span>
          <span className="stat-l">Out in quotes</span>
        </div>
        <div className="stat">
          <span className="stat-n sm">{s ? money(s.outstanding) : '—'}</span>
          <span className="stat-l">Still to collect</span>
        </div>
        <div className="stat">
          <span className="stat-n sm">{s?.leadsThisMonth ?? '—'}</span>
          <span className="stat-l">Requests this month</span>
        </div>
      </div>

      {s && s.newLeads === 0 && s.openJobs === 0 && (
        <div className="empty soft">
          <h2>Nothing needs you right now</h2>
          <p>New website requests land in Requests and you will get an email as soon as one arrives.</p>
          <Link className="btn accent" to="/admin/quotes/new">Build a quote</Link>
        </div>
      )}
    </div>
  );
}
