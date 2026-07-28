import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import type { Material, MaterialKind } from '../../lib/types';

const KINDS: { k: MaterialKind; label: string; hint: string }[] = [
  { k:'stone',   label:'Stone',    hint:'Priced per square foot' },
  { k:'cabinet', label:'Cabinets', hint:'Priced per linear foot' },
  { k:'edge',    label:'Edges',    hint:'Added per linear foot' },
  { k:'adder',   label:'Extras',   hint:'Cutouts, backsplash, tear-out' },
];

export default function Catalog() {
  const [rows, setRows] = useState<Material[]>([]);
  const [kind, setKind] = useState<MaterialKind>('stone');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Partial<Material>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('materials').select('*')
      .is('deleted_at', null).order('kind').order('sort_order');
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setRows((data as Material[]) ?? []);
    setDraft({});
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = rows.filter(r => r.kind === kind);

  function edit(id: string, patch: Partial<Material>) {
    setDraft({ ...draft, [id]: { ...(draft[id] ?? {}), ...patch } });
  }

  async function save(m: Material) {
    const d = draft[m.id]; if (!d) return;
    const { error } = await supabase.from('materials').update(d).eq('id', m.id);
    if (error) { setErr(error.message); return; }
    logAction('updated', 'materials', m.id, `Updated pricing for ${m.name}`);
    load();
  }

  async function toggle(m: Material) {
    const { error } = await supabase.from('materials')
      .update({ is_active: !m.is_active }).eq('id', m.id);
    if (error) { setErr(error.message); return; }
    load();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>What you sell</h1>
        <p>Your stone, cabinets, edges and extras. These prices drive every quote, so keep them current.</p>
      </header>

      <div className="notice">
        Starting prices are Central Florida estimates, not your numbers. Replace them with your real
        pricing before sending a quote to a customer.
      </div>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="chips-row">
        {KINDS.map(k => (
          <button key={k.k} className={'chip' + (kind === k.k ? ' on' : '')} onClick={() => setKind(k.k)}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="muted small">{KINDS.find(k => k.k === kind)?.hint}</p>

      {loading ? <p className="muted">Loading</p>
        : shown.length === 0 ? (
        <div className="empty"><h2>Nothing in this list yet</h2>
          <p>Add the products you actually offer so quotes price themselves.</p></div>
      ) : (
        <table className="tbl">
          <thead><tr>
            <th>Name</th><th>Supplier</th><th className="num">You charge</th>
            <th className="num">Your cost</th><th>Active</th><th></th>
          </tr></thead>
          <tbody>
            {shown.map(m => {
              const d = draft[m.id] ?? {};
              const dirty = Object.keys(d).length > 0;
              return (
                <tr key={m.id} className={m.is_active ? '' : 'off'}>
                  <td>
                    <span className="name-cell">
                      {m.swatch_path && (
                        <img className="swatch-thumb" src={m.swatch_path} alt=""
                          loading="lazy" width="40" height="40" />
                      )}
                      <span>{m.name}{m.tier && <span className="meta"> · {m.tier}</span>}</span>
                    </span>
                  </td>
                  <td className="meta">{m.supplier ?? '—'}</td>
                  <td className="num">
                    <input className="num-in" type="number" step="0.01"
                      value={d.unit_price ?? m.unit_price}
                      onChange={e => edit(m.id, { unit_price: Number(e.target.value) })}
                      aria-label={`Price for ${m.name}`} />
                  </td>
                  <td className="num">
                    <input className="num-in" type="number" step="0.01"
                      value={d.cost ?? m.cost ?? 0}
                      onChange={e => edit(m.id, { cost: Number(e.target.value) })}
                      aria-label={`Cost for ${m.name}`} />
                  </td>
                  <td>
                    <button className={'toggle' + (m.is_active ? ' on' : '')}
                      onClick={() => toggle(m)} aria-pressed={m.is_active}
                      aria-label={`${m.is_active ? 'Hide' : 'Show'} ${m.name}`}>
                      {m.is_active ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td><button className="btn sm" disabled={!dirty} onClick={() => save(m)}>
                    {dirty ? 'Save' : 'Saved'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="muted small">Your cost stays private. It never appears on a quote or on your website.</p>

      {kind === 'cabinet' && (
        <section className="spec-books">
          <h2>Cabinet spec books</h2>
          <p className="muted">
            The full manufacturer catalogs — door styles, box construction, sizing charts.
            These live here in the portal only. The public website never links to them and
            never shows the supplier's name.
          </p>
          <div className="spec-grid">
            <a className="spec-card" href="/specs/line-a-shaker-spec.pdf" target="_blank" rel="noreferrer">
              <span className="spec-title">Classic Shaker line</span>
              <span className="meta">All-wood framed cabinets · door styles &amp; colors · PDF</span>
              <span className="spec-open">Open spec book</span>
            </a>
            <a className="spec-card" href="/specs/line-b-frameless-spec.pdf" target="_blank" rel="noreferrer">
              <span className="spec-title">European Frameless line</span>
              <span className="meta">Modern slab-door cabinets · finishes &amp; sizing · PDF</span>
              <span className="spec-open">Open spec book</span>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
