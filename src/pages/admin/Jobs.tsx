import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { money, shortDate } from '../../lib/money';
import type { Job, JobStatus, Customer } from '../../lib/types';

const FLOW: JobStatus[] = ['sold','template','fabrication','scheduled','installed','complete'];
const ALL: JobStatus[] = [...FLOW, 'on_hold'];
const LABEL: Record<JobStatus,string> = {
  sold:'Sold', template:'Templated', fabrication:'In fabrication', scheduled:'Install scheduled',
  installed:'Installed', complete:'Complete', on_hold:'On hold'
};

export default function Jobs() {
  const [rows, setRows] = useState<Job[]>([]);
  const [custs, setCusts] = useState<Record<string,string>>({});
  const [filter, setFilter] = useState<'open' | 'all' | JobStatus>('open');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('jobs').select('*').is('deleted_at', null)
      .order('install_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (filter === 'open') q = q.not('status', 'in', '("complete")');
    else if (filter !== 'all') q = q.eq('status', filter);
    const [js, cs] = await Promise.all([q, supabase.from('customers').select('id,name')]);
    setLoading(false);
    if (js.error) { setErr(js.error.message); return; }
    setRows((js.data as Job[]) ?? []);
    const map: Record<string,string> = {};
    ((cs.data as Customer[]) ?? []).forEach(c => { map[c.id] = c.name; });
    setCusts(map);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function update(j: Job, patch: Partial<Job>) {
    const prev = rows;
    setRows(rows.map(r => r.id === j.id ? { ...r, ...patch } : r));
    const { error } = await supabase.from('jobs').update(patch).eq('id', j.id);
    if (error) { setRows(prev); setErr(error.message); return; }
    logAction('updated', 'jobs', j.id, `Job ${j.job_number} updated`);
    if (filter !== 'all') load();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Jobs</h1>
        <p>Work you have sold, from template through install.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="chips-row">
        {(['open','all', ...ALL] as const).map(f => (
          <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
            {f === 'open' ? 'Open' : f === 'all' ? 'All' : LABEL[f as JobStatus]}
          </button>
        ))}
      </div>

      {loading ? <p className="muted">Loading</p>
        : rows.length === 0 ? (
        <div className="empty">
          <h2>{filter === 'open' ? 'No open jobs' : 'No jobs yet'}</h2>
          <p>A job appears here the moment you mark a quote accepted.</p>
        </div>
      ) : (
        <ul className="rows">
          {rows.map(j => (
            <li key={j.id} className="row-card">
              <div className="row-main">
                <div className="row-who">
                  <strong>{j.job_number ?? 'Job'}</strong>
                  <span className="meta">
                    {j.customer_id ? custs[j.customer_id] ?? 'Customer removed' : 'No customer'}
                    {j.city ? ' · ' + j.city : ''}
                  </span>
                </div>
                <div className="job-money">
                  <span className="amount">{money(j.contract_total)}</span>
                  {j.balance_due > 0 && <span className="meta">{money(j.balance_due)} outstanding</span>}
                </div>
                <div className="job-controls">
                  <label className="sr-only" htmlFor={'js-'+j.id}>Stage</label>
                  <select id={'js-'+j.id} value={j.status}
                    onChange={e => update(j, { status: e.target.value as JobStatus })}>
                    {ALL.map(s => <option key={s} value={s}>{LABEL[s]}</option>)}
                  </select>
                  <label className="sr-only" htmlFor={'jd-'+j.id}>Install date</label>
                  <input id={'jd-'+j.id} type="date" value={j.install_date ?? ''}
                    onChange={e => update(j, { install_date: e.target.value || null })} />
                </div>
              </div>
              {j.install_date && (
                <div className="row-detail thin">
                  <span className="meta">Install {shortDate(j.install_date)}</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
