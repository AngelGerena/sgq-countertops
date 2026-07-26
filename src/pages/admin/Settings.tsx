import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { BusinessSettings } from '../../lib/types';

const FIELDS: { key: keyof BusinessSettings; label: string; type?: string }[] = [
  { key: 'legal_name',       label: 'Legal business name' },
  { key: 'trade_name',       label: 'Name customers see' },
  { key: 'license_number',   label: 'License number' },
  { key: 'address',          label: 'Address' },
  { key: 'phone',            label: 'Phone' },
  { key: 'email',            label: 'Email' },
  { key: 'service_area',     label: 'Service area' },
  { key: 'hours',            label: 'Hours' },
  { key: 'review_url',       label: 'Google review link' },
  { key: 'deposit_pct',      label: 'Deposit percent',  type: 'number' },
  { key: 'tax_rate',         label: 'Sales tax percent', type: 'number' },
  { key: 'ach_discount_pct', label: 'Bank transfer discount percent', type: 'number' }
];

export default function Settings() {
  const [s, setS] = useState<BusinessSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('business_settings').select('*').maybeSingle()
      .then(({ data, error }) => {
        if (error) { setMsg(error.message); return; }
        setS(data as BusinessSettings);
      });
  }, []);

  async function save() {
    if (!s) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('business_settings').update(s).eq('id', true);
    setBusy(false);
    setMsg(error ? error.message : 'Settings saved');
  }

  if (!s) return <div className="view"><p>Loading settings</p></div>;

  return (
    <div className="view">
      <header className="view-head">
        <h1>Settings</h1>
        <p>Your business details. These appear on quotes, invoices and contracts.</p>
      </header>
      {msg && <div className="notice">{msg}</div>}
      <section className="panel"><div className="panel-body">
        {FIELDS.map(f => (
          <div className="field" key={String(f.key)}>
            <label>{f.label}</label>
            <input type={f.type ?? 'text'}
              value={(s[f.key] as string | number | null) ?? ''}
              onChange={e => setS({ ...s, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} />
          </div>
        ))}
        <div className="field-check">
          <label><input type="checkbox" checked={s.accept_card}
            onChange={e => setS({ ...s, accept_card: e.target.checked })} /> Accept cards</label>
          <label><input type="checkbox" checked={s.accept_ach}
            onChange={e => setS({ ...s, accept_ach: e.target.checked })} /> Accept bank transfer</label>
        </div>
        <button className="btn gold" onClick={save} disabled={busy}>
          {busy ? 'Saving' : 'Save settings'}
        </button>
      </div></section>
    </div>
  );
}
