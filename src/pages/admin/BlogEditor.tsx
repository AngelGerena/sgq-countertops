import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { slugify, Markdown } from '../../lib/markdown';
import type { Post } from '../../lib/types';

const BLANK: Partial<Post> = {
  slug:'', status:'draft', title_en:'', title_es:'', excerpt_en:'', excerpt_es:'',
  body_en:'', body_es:'', city:'', county:'', materials:[], author:'Cesar Santiago'
};

export default function BlogEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const [p, setP] = useState<Partial<Post>>(BLANK);
  const [saved, setSaved] = useState<string>('');
  const [lang, setLang] = useState<'en'|'es'>('en');
  const [tab, setTab] = useState<'write'|'preview'|'seo'>('write');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (isNew) { setSaved(JSON.stringify(BLANK)); return; }
    supabase.from('posts').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error) { setErr(error.message); return; }
      if (data) { setP(data as Post); setSaved(JSON.stringify(data)); }
    });
  }, [id, isNew]);

  const dirty = JSON.stringify(p) !== saved;
  const set = (patch: Partial<Post>) => setP({ ...p, ...patch });

  function onTitle(v: string) {
    const patch: Partial<Post> = { title_en: v };
    if (isNew || !p.slug) patch.slug = slugify(v);
    set(patch);
  }

  async function save(publish?: boolean) {
    if (!p.title_en?.trim()) { setErr('Give the post a title first.'); return; }
    setBusy(true); setErr(null);
    const payload: Partial<Post> = {
      ...p,
      slug: p.slug || slugify(p.title_en),
      materials: p.materials ?? [],
      status: publish ? 'published' : (p.status ?? 'draft'),
    };
    if (publish && !p.published_at) payload.published_at = new Date().toISOString();
    delete (payload as Record<string, unknown>).id;
    delete (payload as Record<string, unknown>).created_at;
    delete (payload as Record<string, unknown>).updated_at;

    const res = isNew
      ? await supabase.from('posts').insert(payload).select('id').single()
      : await supabase.from('posts').update(payload).eq('id', id).select('id').single();
    setBusy(false);
    if (res.error) {
      setErr(res.error.message.includes('duplicate')
        ? 'That web address is already used by another post. Change the slug.'
        : res.error.message);
      return;
    }
    logAction(isNew ? 'created' : 'updated', 'posts', res.data.id, `${publish ? 'Published' : 'Saved'} ${p.title_en}`);
    setMsg(publish ? 'Published' : 'Saved');
    if (isNew) nav(`/admin/blog/${res.data.id}`, { replace: true });
    else setSaved(JSON.stringify({ ...p, ...payload }));
  }

  const body = lang === 'es' ? (p.body_es ?? '') : (p.body_en ?? '');
  const matStr = (p.materials ?? []).join(', ');

  return (
    <div className="view">
      <header className="view-head">
        <h1>{isNew ? 'Write a post' : 'Edit post'}</h1>
        <p>Write about one real job. The town and the stone are what people search for.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}
      {msg && <div className="notice">{msg}</div>}

      <div className="editor-bar">
        <div className="chips-row">
          {(['write','preview','seo'] as const).map(t => (
            <button key={t} className={'chip' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="lang-pick">
          {(['en','es'] as const).map(l => (
            <button key={l} className={'chip' + (lang === l ? ' on' : '')} onClick={() => setLang(l)}>
              {l === 'en' ? 'English' : 'Spanish'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'write' && (
        <section className="panel"><div className="panel-body">
          <label htmlFor="b-title">Title ({lang === 'en' ? 'English' : 'Spanish'})</label>
          {lang === 'en'
            ? <input id="b-title" value={p.title_en ?? ''} onChange={e => onTitle(e.target.value)} />
            : <input id="b-title" value={p.title_es ?? ''} onChange={e => set({ title_es: e.target.value })} />}

          <label htmlFor="b-exc">Short summary</label>
          <textarea id="b-exc" rows={2}
            value={(lang === 'en' ? p.excerpt_en : p.excerpt_es) ?? ''}
            onChange={e => set(lang === 'en' ? { excerpt_en: e.target.value } : { excerpt_es: e.target.value })} />

          <label htmlFor="b-body">The story</label>
          <textarea id="b-body" className="body-area" value={body}
            onChange={e => set(lang === 'en' ? { body_en: e.target.value } : { body_es: e.target.value })} />
          <p className="muted small">
            Use ## for a heading, **bold**, *italic*, - for a list, &gt; for a quote.
          </p>
        </div></section>
      )}

      {tab === 'preview' && (
        <section className="panel"><div className="panel-body">
          <h2 className="preview-title">{(lang === 'en' ? p.title_en : p.title_es) || 'Untitled'}</h2>
          {body.trim() ? <Markdown source={body} />
            : <p className="muted">Nothing written in {lang === 'en' ? 'English' : 'Spanish'} yet.</p>}
        </div></section>
      )}

      {tab === 'seo' && (
        <section className="panel"><div className="panel-body">
          <div className="grid-2">
            <div><label htmlFor="b-city">Town or city</label>
              <input id="b-city" value={p.city ?? ''} onChange={e => set({ city: e.target.value })}
                placeholder="DeBary" /></div>
            <div><label htmlFor="b-county">County</label>
              <input id="b-county" value={p.county ?? ''} onChange={e => set({ county: e.target.value })}
                placeholder="Volusia" /></div>
          </div>
          <label htmlFor="b-mat">Materials used</label>
          <input id="b-mat" value={matStr} placeholder="Calacatta Gold Quartz, white shaker"
            onChange={e => set({ materials: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} />
          <p className="muted small">Town plus material is what a homeowner actually types into Google.</p>

          <label htmlFor="b-slug">Web address</label>
          <div className="slug-row">
            <span className="slug-pre">/blog/</span>
            <input id="b-slug" value={p.slug ?? ''} onChange={e => set({ slug: slugify(e.target.value) })} />
          </div>

          <label htmlFor="b-meta">Search description</label>
          <textarea id="b-meta" rows={2} maxLength={160}
            value={(lang === 'en' ? p.meta_description_en : p.meta_description_es) ?? ''}
            onChange={e => set(lang === 'en'
              ? { meta_description_en: e.target.value } : { meta_description_es: e.target.value })} />
          <p className="muted small">
            {((lang === 'en' ? p.meta_description_en : p.meta_description_es) ?? '').length}/160 characters.
            This is the grey text under your link on Google.
          </p>

          <label htmlFor="b-alt">Photo description</label>
          <input id="b-alt" value={(lang === 'en' ? p.cover_alt_en : p.cover_alt_es) ?? ''}
            onChange={e => set(lang === 'en' ? { cover_alt_en: e.target.value } : { cover_alt_es: e.target.value })}
            placeholder="Black quartz island with gold faucet in a DeBary kitchen" />
        </div></section>
      )}

      <div className="row-actions sticky-actions">
        <button className="btn" onClick={() => save(false)} disabled={busy || !dirty}>
          {busy ? 'Saving' : dirty ? 'Save draft' : 'Saved'}
        </button>
        <button className="btn accent" onClick={() => save(true)} disabled={busy}>
          {p.status === 'published' ? 'Save and keep live' : 'Publish'}
        </button>
        <button className="btn ghost" onClick={() => nav('/admin/blog')}>Back</button>
      </div>
    </div>
  );
}
