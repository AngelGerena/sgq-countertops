import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { shortDate } from '../../lib/money';
import type { Customer } from '../../lib/types';

const BLANK = { name:'', email:'', phone:'', address:'', city:'', zip:'', lang:'en', notes:'' };

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('customers').select('*')
      .is('deleted_at', null).order('name');
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setRows((data as Customer[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = rows.filter(r => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [r.name, r.email, r.phone, r.city].some(v => (v ?? '').toLowerCase().includes(t));
  });

  async function save() {
    if (!editing?.name?.trim()) { setErr('A name is required.'); return; }
    setBusy(true); setErr(null);
    const payload = {
      name: editing.name, email: editing.email || null, phone: editing.phone || null,
      address: editing.address || null, city: editing.city || null, zip: editing.zip || null,
      lang: editing.lang ?? 'en', notes: editing.notes || null
    };
    const res = editing.id
      ? await supabase.from('customers').update(payload).eq('id', editing.id)
      : await supabase.from('customers').insert(payload);
    setBusy(false);
    if (res.error) { setErr(res.error.message); return; }
    logAction(editing.id ? 'updated' : 'created', 'customers', editing.id ?? null,
      `${editing.id ? 'Updated' : 'Added'} customer ${editing.name}`);
    setEditing(null); load();
  }

  async function remove(c: Customer) {
    const typed = prompt(`This hides ${c.name} from your list. Their past jobs and invoices are kept.\n\nType their name to confirm:`);
    if (typed !== c.name) return;
    const { error } = await supabase.from('customers')
      .update({ deleted_at: new Date().toISOString() }).eq('id', c.id);
    if (error) { setErr(error.message); return; }
    logAction('deleted', 'customers', c.id, `Removed customer ${c.name}`);
    load();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Customers</h1>
        <p>Everyone you have worked with or quoted.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="toolbar">
        <input className="search" placeholder="Search by name, phone or city"
          value={q} onChange={e => setQ(e.target.value)} aria-label="Search customers" />
        <button className="btn accent" onClick={() => setEditing({ ...BLANK } as Partial<Customer>)}>
          Add customer
        </button>
      </div>

      {editing && (
        <section className="panel editor">
          <div className="panel-head"><h2>{editing.id ? 'Edit customer' : 'New customer'}</h2></div>
          <div className="panel-body">
            <div className="grid-2">
              <div><label htmlFor="c-name">Name</label>
                <input id="c-name" value={editing.name ?? ''} onChange={e => setEditing({...editing, name:e.target.value})} /></div>
              <div><label htmlFor="c-phone">Phone</label>
                <input id="c-phone" value={editing.phone ?? ''} onChange={e => setEditing({...editing, phone:e.target.value})} /></div>
              <div><label htmlFor="c-email">Email</label>
                <input id="c-email" value={editing.email ?? ''} onChange={e => setEditing({...editing, email:e.target.value})} /></div>
              <div><label htmlFor="c-city">City</label>
                <input id="c-city" value={editing.city ?? ''} onChange={e => setEditing({...editing, city:e.target.value})} /></div>
              <div><label htmlFor="c-addr">Address</label>
                <input id="c-addr" value={editing.address ?? ''} onChange={e => setEditing({...editing, address:e.target.value})} /></div>
              <div><label htmlFor="c-lang">Language</label>
                <select id="c-lang" value={editing.lang ?? 'en'} onChange={e => setEditing({...editing, lang:e.target.value as 'en'|'es'})}>
                  <option value="en">English</option><option value="es">Spanish</option>
                </select></div>
            </div>
            <label htmlFor="c-notes">Notes</label>
            <textarea id="c-notes" value={editing.notes ?? ''} onChange={e => setEditing({...editing, notes:e.target.value})} />
            <div className="row-actions">
              <button className="btn accent" onClick={save} disabled={busy}>{busy ? 'Saving' : 'Save'}</button>
              <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {loading ? <p className="muted">Loading</p>
        : shown.length === 0 ? (
        <div className="empty">
          <h2>{q ? 'Nobody matches that search' : 'No customers yet'}</h2>
          <p>{q ? 'Try a different name, phone or city.'
                : 'Customers get added here when you save a website request, or you can add one directly.'}</p>
        </div>
      ) : (
        <ul className="rows">
          {shown.map(c => (
            <li key={c.id} className="row-card">
              <div className="row-main">
                <div className="row-who">
                  <strong>{c.name}</strong>
                  <span className="meta">{[c.city, c.phone].filter(Boolean).join(' · ') || 'No details'}</span>
                </div>
                <span className="meta when">since {shortDate(c.created_at)}</span>
                <div className="row-actions inline">
                  <button className="btn ghost sm" onClick={() => setEditing(c)}>Edit</button>
                  <button className="btn ghost sm danger-text" onClick={() => remove(c)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
