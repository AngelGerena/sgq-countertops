import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useContent } from '../../lib/SiteContentProvider';
import type { SiteContentRow } from '../../lib/types';

export default function SiteEditor() {
  const { rows, reload } = useContent();
  const [draft, setDraft] = useState<Record<string, { en: string; es: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const d: Record<string, { en: string; es: string }> = {};
    rows.forEach(r => { d[r.key] = { en: r.value_en ?? '', es: r.value_es ?? '' }; });
    setDraft(d);
  }, [rows]);

  const sections = Array.from(new Set(rows.map(r => r.section)));

  async function save(row: SiteContentRow) {
    setSaving(row.key); setMsg(null);
    const v = draft[row.key] ?? { en: '', es: '' };
    const { error } = await supabase.from('site_content').update({
      value_en: v.en.trim() === '' ? null : v.en,
      value_es: v.es.trim() === '' ? null : v.es
    }).eq('key', row.key);
    setSaving(null);
    if (error) { setMsg(error.message); return; }
    setMsg('Saved ' + row.label);
    await reload();
  }

  async function revert(row: SiteContentRow) {
    setSaving(row.key); setMsg(null);
    const { error } = await supabase.from('site_content')
      .update({ value_en: null, value_es: null }).eq('key', row.key);
    setSaving(null);
    if (error) { setMsg(error.message); return; }
    setMsg('Reverted ' + row.label + ' to its default');
    await reload();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Site editor</h1>
        <p>Change any text on the public site. Clear a field and it goes back to the original wording, so nothing can end up blank.</p>
      </header>

      {msg && <div className="notice">{msg}</div>}

      {sections.map(section => (
        <section className="panel" key={section}>
          <div className="panel-head"><h2>{section}</h2></div>
          <div className="panel-body">
            {rows.filter(r => r.section === section).map(row => {
              const v = draft[row.key] ?? { en: '', es: '' };
              const dirty = (row.value_en ?? '') !== v.en || (row.value_es ?? '') !== v.es;
              const Field = row.kind === 'longtext' ? 'textarea' : 'input';
              return (
                <div className="field-row" key={row.key}>
                  <div className="field-label">
                    <strong>{row.label}</strong>
                    {row.hint && <span className="hint">{row.hint}</span>}
                  </div>
                  <div className="field-inputs">
                    <label>English</label>
                    <Field value={v.en}
                      onChange={(e: any) => setDraft({ ...draft, [row.key]: { ...v, en: e.target.value } })} />
                    <label>Spanish</label>
                    <Field value={v.es}
                      onChange={(e: any) => setDraft({ ...draft, [row.key]: { ...v, es: e.target.value } })} />
                    <div className="field-actions">
                      <button className="btn sm" disabled={!dirty || saving === row.key}
                        onClick={() => save(row)}>
                        {saving === row.key ? 'Saving' : dirty ? 'Save' : 'Saved'}
                      </button>
                      <button className="btn ghost sm"
                        disabled={saving === row.key || (!row.value_en && !row.value_es)}
                        onClick={() => revert(row)}>Use default</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
