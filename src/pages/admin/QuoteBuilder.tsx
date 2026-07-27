import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { money } from '../../lib/money';
import type { Material, TravelZone, Customer, BusinessSettings } from '../../lib/types';

interface Line { key: string; material: Material; qty: number; }

export default function QuoteBuilder() {
  const [mats, setMats] = useState<Material[]>([]);
  const [zones, setZones] = useState<TravelZone[]>([]);
  const [custs, setCusts] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  const [customerId, setCustomerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [units, setUnits] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const [m, z, c, s] = await Promise.all([
        supabase.from('materials').select('*').is('deleted_at', null).eq('is_active', true).order('kind').order('sort_order'),
        supabase.from('travel_zones').select('*').eq('is_active', true),
        supabase.from('customers').select('*').is('deleted_at', null).order('name'),
        supabase.from('business_settings').select('*').maybeSingle(),
      ]);
      const bad = m.error || z.error || c.error || s.error;
      if (bad) { setErr(bad.message); return; }
      setMats((m.data as Material[]) ?? []);
      setZones((z.data as TravelZone[]) ?? []);
      setCusts((c.data as Customer[]) ?? []);
      setSettings(s.data as BusinessSettings);
      if (z.data && z.data.length) setZoneId((z.data as TravelZone[])[0].id);
    })();
  }, []);

  function addLine(m: Material) {
    setLines([...lines, { key: crypto.randomUUID(), material: m, qty: m.unit === 'each' ? 1 : 0 }]);
  }
  function setQty(key: string, qty: number) {
    setLines(lines.map(l => l.key === key ? { ...l, qty } : l));
  }
  const removeLine = (key: string) => setLines(lines.filter(l => l.key !== key));

  /* Multi-unit work is where the volume discount lives. 8+ units was the
     threshold Cesar described for condo conversion packages. */
  const volumeRate = (u: number) => u >= 12 ? 0.12 : u >= 8 ? 0.08 : u >= 4 ? 0.04 : 0;

  const calc = useMemo(() => {
    const perUnit = lines.reduce((s, l) => s + l.qty * l.material.unit_price, 0);
    const gross = perUnit * units;
    const volPct = volumeRate(units);
    const volume = gross * volPct;
    const subtotal = gross - volume;
    const zone = zones.find(z => z.id === zoneId);
    const uplift = subtotal * ((zone?.uplift_pct ?? 0) / 100);
    const taxRate = settings?.tax_rate ?? 0;
    const tax = (subtotal + uplift) * (taxRate / 100);
    const total = subtotal + uplift + tax;
    const deposit = total * ((settings?.deposit_pct ?? 50) / 100);
    return { perUnit, gross, volume, volPct, subtotal, uplift, tax, total, deposit, zone, taxRate };
  }, [lines, units, zoneId, zones, settings]);

  async function saveQuote() {
    if (!lines.length) { setErr('Add at least one line before saving.'); return; }
    setBusy(true); setErr(null);

    const { data: num, error: numErr } = await supabase.rpc('next_doc_number', { p_kind: 'quote' });
    if (numErr) { setBusy(false); setErr(numErr.message); return; }

    const { data: q, error: qErr } = await supabase.from('quotes').insert({
      quote_number: num, customer_id: customerId || null, travel_zone_id: zoneId || null,
      status: 'draft', subtotal: calc.subtotal, travel_uplift: calc.uplift,
      tax: calc.tax, total: calc.total, deposit_due: calc.deposit, notes: [units > 1 ? `${units} units` : null, notes || null].filter(Boolean).join(' — ') || null
    }).select('id, quote_number').single();
    if (qErr) { setBusy(false); setErr(qErr.message); return; }

    const items = lines.map((l, i) => ({
      quote_id: q.id, material_id: l.material.id, label: l.material.name,
      qty: l.qty, unit: l.material.unit, unit_price: l.material.unit_price,
      line_total: l.qty * l.material.unit_price, sort_order: i
    }));
    const { error: iErr } = await supabase.from('quote_items').insert(items);
    setBusy(false);
    if (iErr) { setErr(iErr.message); return; }

    logAction('created', 'quotes', q.id, `Created quote ${q.quote_number}`);
    nav('/admin/quotes');
  }

  const byKind = (k: string) => mats.filter(m => m.kind === k);
  const unitLabel = (u: string) => u === 'sqft' ? 'sq ft' : u === 'linear_ft' ? 'linear ft' : 'each';

  return (
    <div className="view">
      <header className="view-head">
        <h1>Build a quote</h1>
        <p>Pick what the job needs. The price works itself out as you go.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="quote-grid">
        <div>
          <section className="panel">
            <div className="panel-head"><h2>Who is it for</h2></div>
            <div className="panel-body">
              <label htmlFor="q-cust">Customer</label>
              <select id="q-cust" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Not linked to anyone yet</option>
                {custs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label htmlFor="q-units">How many units</label>
              <input id="q-units" type="number" min="1" value={units}
                onChange={e => setUnits(Math.max(1, Number(e.target.value)))} />
              <p className="muted small">One for a single kitchen. More for a condo or apartment package —
                4 units earns 4% off, 8 earns 8%, 12 or more earns 12%.</p>

              <label htmlFor="q-zone">Where is the job</label>
              <select id="q-zone" value={zoneId} onChange={e => setZoneId(e.target.value)}>
                {zones.map(z => (
                  <option key={z.id} value={z.id}>
                    {z.name}{z.uplift_pct > 0 ? ` (+${z.uplift_pct}%)` : ''}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {['stone','cabinet','edge','adder'].map(k => (
            <section className="panel" key={k}>
              <div className="panel-head"><h2>
                {k === 'stone' ? 'Stone' : k === 'cabinet' ? 'Cabinets' : k === 'edge' ? 'Edge' : 'Extras'}
              </h2></div>
              <div className="panel-body pick-list">
                {byKind(k).map(m => (
                  <button key={m.id} className="pick" onClick={() => addLine(m)}>
                    <span>{m.name}</span>
                    <span className="meta">{money(m.unit_price)} / {unitLabel(m.unit)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <aside className="quote-summary">
          <div className="panel">
            <div className="panel-head"><h2>This quote</h2></div>
            <div className="panel-body">
              {lines.length === 0 ? (
                <p className="muted">Nothing added yet. Pick a stone to start.</p>
              ) : (
                <ul className="lines">
                  {lines.map(l => (
                    <li key={l.key}>
                      <div className="line-top">
                        <span>{l.material.name}</span>
                        <button className="x" onClick={() => removeLine(l.key)}
                          aria-label={`Remove ${l.material.name}`}>&times;</button>
                      </div>
                      <div className="line-bot">
                        <input type="number" min="0" step="0.5" value={l.qty}
                          onChange={e => setQty(l.key, Number(e.target.value))}
                          aria-label={`Quantity for ${l.material.name}`} />
                        <span className="meta">{unitLabel(l.material.unit)} at {money(l.material.unit_price)}</span>
                        <strong>{money(l.qty * l.material.unit_price)}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="totals">
                {units > 1 && (
                  <>
                    <div><span>Per unit</span><span>{money(calc.perUnit)}</span></div>
                    <div><span>{units} units</span><span>{money(calc.gross)}</span></div>
                  </>
                )}
                {calc.volume > 0 && (
                  <div className="volume">
                    <span>Volume discount ({Math.round(calc.volPct * 100)}%)</span>
                    <span>-{money(calc.volume)}</span>
                  </div>
                )}
                <div><span>Subtotal</span><span>{money(calc.subtotal)}</span></div>
                {calc.uplift > 0 && (
                  <div><span>Travel · {calc.zone?.name}</span><span>{money(calc.uplift)}</span></div>
                )}
                <div><span>Tax at {calc.taxRate}%</span><span>{money(calc.tax)}</span></div>
                <div className="grand"><span>Total</span><span>{money(calc.total)}</span></div>
                <div className="deposit">
                  <span>Deposit due ({settings?.deposit_pct ?? 50}%)</span><span>{money(calc.deposit)}</span>
                </div>
              </div>

              <label htmlFor="q-notes">Notes for the customer</label>
              <textarea id="q-notes" value={notes} onChange={e => setNotes(e.target.value)} />

              <button className="btn accent block" onClick={saveQuote} disabled={busy || !lines.length}>
                {busy ? 'Saving' : 'Save quote'}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
