import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { relDays } from '../../lib/money';
import type { Lead, LeadStatus } from '../../lib/types';

const STATUSES: LeadStatus[] = ['new','contacted','measured','quoted','won','lost'];
const FILTERS = ['all', ...STATUSES] as const;

export default function Leads() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const nav = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    let q = supabase.from('leads').select('*')
      .is('deleted_at', null).order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setRows((data as Lead[]) ?? []);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(l: Lead, status: LeadStatus) {
    const prev = rows;
    setRows(rows.map(r => r.id === l.id ? { ...r, status } : r));
    const { error } = await supabase.from('leads').update({ status }).eq('id', l.id);
    if (error) { setRows(prev); setErr(error.message); return; }
    logAction('updated', 'leads', l.id, `${l.name} moved to ${status}`);
    if (filter !== 'all') load();
  }

  async function softDelete(l: Lead) {
    if (!confirm(`Remove the request from ${l.name}? It will be hidden but not permanently erased.`)) return;
    const prev = rows;
    setRows(rows.filter(r => r.id !== l.id));
    const { error } = await supabase.from('leads')
      .update({ deleted_at: new Date().toISOString() }).eq('id', l.id);
    if (error) { setRows(prev); setErr(error.message); return; }
    logAction('deleted', 'leads', l.id, `Removed request from ${l.name}`);
  }

  async function toCustomer(l: Lead) {
    const { data, error } = await supabase.from('customers').insert({
      name: l.name, email: l.email, phone: l.phone, city: l.city,
      notes: l.message ? `From website request: ${l.message}` : null
    }).select('id').single();
    if (error) { setErr(error.message); return; }
    await supabase.from('leads').update({ customer_id: data.id, status: 'contacted' }).eq('id', l.id);
    logAction('created', 'customers', data.id, `Created customer from lead ${l.name}`);
    nav('/admin/customers');
  }

  const counts = STATUSES.reduce<Record<string, number>>((a, s) => {
    a[s] = rows.filter(r => r.status === s).length; return a;
  }, {});

  return (
    <div className="view">
      <header className="view-head">
        <h1>Requests</h1>
        <p>Every quote request from your website lands here, newest first.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="chips-row">
        {FILTERS.map(f => (
          <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f}
            {f !== 'all' && counts[f] ? <span className="chip-n">{counts[f]}</span> : null}
          </button>
        ))}
      </div>

      {loading ? <p className="muted">Loading</p>
        : rows.length === 0 ? (
        <div className="empty">
          <h2>No requests yet</h2>
          <p>When someone fills out the form on your website it lands here, and we email you straight away.
             Share your site link to get the first one.</p>
        </div>
      ) : (
        <ul className="rows">
          {rows.map(l => (
            <li key={l.id} className={'row-card' + (open === l.id ? ' open' : '')}>
              <div className="row-main" onClick={() => setOpen(open === l.id ? null : l.id)}>
                <div className="row-who">
                  <strong>{l.name}</strong>
                  <span className="meta">
                    {[l.city, l.phone].filter(Boolean).join(' · ') || 'No contact details'}
                  </span>
                </div>
                <span className={'pill s-' + l.status}>{l.status}</span>
                <span className="meta when">{relDays(l.created_at)}</span>
              </div>

              {open === l.id && (
                <div className="row-detail">
                  {l.message && <p className="quote-text">{l.message}</p>}
                  <div className="detail-grid">
                    {l.email && <a href={'mailto:' + l.email}>{l.email}</a>}
                    {l.phone && <a href={'tel:' + l.phone.replace(/[^0-9]/g,'')}>{l.phone}</a>}
                    <span>Came from {l.source.replace('_',' ')}</span>
                  </div>
                  <div className="row-actions">
                    <label htmlFor={'st-'+l.id} className="sr-only">Status</label>
                    <select id={'st-'+l.id} value={l.status}
                      onChange={e => setStatus(l, e.target.value as LeadStatus)}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {!l.customer_id && (
                      <button className="btn sm" onClick={() => toCustomer(l)}>Save as customer</button>
                    )}
                    <button className="btn ghost sm danger-text" onClick={() => softDelete(l)}>Remove</button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
