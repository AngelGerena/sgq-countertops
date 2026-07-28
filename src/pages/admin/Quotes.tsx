import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { money, shortDate } from '../../lib/money';
import type { Quote, QuoteStatus, Customer } from '../../lib/types';

const STATUSES: QuoteStatus[] = ['draft','sent','accepted','declined','expired'];

export default function Quotes() {
  const [rows, setRows] = useState<Quote[]>([]);
  const [custs, setCusts] = useState<Record<string,string>>({});
  const [filter, setFilter] = useState<'all' | QuoteStatus>('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('quotes').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const [qs, cs] = await Promise.all([q, supabase.from('customers').select('id,name')]);
    setLoading(false);
    if (qs.error) { setErr(qs.error.message); return; }
    setRows((qs.data as Quote[]) ?? []);
    const map: Record<string,string> = {};
    ((cs.data as Customer[]) ?? []).forEach(c => { map[c.id] = c.name; });
    setCusts(map);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function setStatus(qt: Quote, status: QuoteStatus) {
    const prev = rows;
    setRows(rows.map(r => r.id === qt.id ? { ...r, status } : r));
    const { error } = await supabase.from('quotes').update({ status }).eq('id', qt.id);
    if (error) { setRows(prev); setErr(error.message); return; }
    logAction('updated', 'quotes', qt.id, `Quote ${qt.quote_number} marked ${status}`);

    if (status === 'accepted') {
      // Only create a job if one doesn't already exist for this quote.
      // Prevents duplicates when a quote is toggled accepted more than once.
      const { data: existing, error: exErr } = await supabase.from('jobs')
        .select('id').eq('quote_id', qt.id).is('deleted_at', null).limit(1);
      if (exErr) { setErr(exErr.message); return; }
      if (!existing || existing.length === 0) {
        const { data: num, error: numErr } = await supabase.rpc('next_doc_number', { p_kind: 'job' });
        if (numErr) { setErr(numErr.message); return; }
        const { data: job, error: jErr } = await supabase.from('jobs').insert({
          job_number: num, customer_id: qt.customer_id, quote_id: qt.id, status: 'sold',
          contract_total: qt.total, balance_due: qt.total - qt.deposit_due
        }).select('id, job_number').single();
        if (jErr) { setErr(jErr.message); return; }
        logAction('created', 'jobs', job.id, `Job ${job.job_number} created from quote ${qt.quote_number}`);
      }
    }
    if (filter !== 'all') load();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Quotes</h1>
        <p>Everything you have priced. Mark one accepted and it becomes a job automatically.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="toolbar">
        <div className="chips-row">
          {(['all', ...STATUSES] as const).map(f => (
            <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <Link className="btn accent" to="/admin/quotes/new">Build a quote</Link>
      </div>

      {loading ? <p className="muted">Loading</p>
        : rows.length === 0 ? (
        <div className="empty">
          <h2>No quotes yet</h2>
          <p>Build your first one and it will show up here. Accepted quotes turn into jobs on their own.</p>
          <Link className="btn accent" to="/admin/quotes/new">Build a quote</Link>
        </div>
      ) : (
        <ul className="rows">
          {rows.map(q => (
            <li key={q.id} className="row-card">
              <div className="row-main">
                <div className="row-who">
                  <strong>{q.quote_number ?? 'Draft'}</strong>
                  <span className="meta">
                    {q.customer_id ? custs[q.customer_id] ?? 'Customer removed' : 'No customer linked'}
                    {' · '}{shortDate(q.created_at)}
                  </span>
                </div>
                <span className="amount">{money(q.total)}</span>
                <label className="sr-only" htmlFor={'qs-'+q.id}>Status</label>
                <select id={'qs-'+q.id} value={q.status}
                  onChange={e => setStatus(q, e.target.value as QuoteStatus)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
