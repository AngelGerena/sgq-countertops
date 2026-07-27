import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { logAction } from '../../lib/audit';
import { shortDate } from '../../lib/money';
import type { Post } from '../../lib/types';

export default function Blog() {
  const [rows, setRows] = useState<Post[]>([]);
  const [filter, setFilter] = useState<'all'|'draft'|'published'>('all');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('posts').select('*').is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data, error } = await q;
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setRows((data as Post[]) ?? []);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  async function toggle(p: Post) {
    const next = p.status === 'published' ? 'draft' : 'published';
    const patch: Partial<Post> = { status: next };
    if (next === 'published' && !p.published_at) patch.published_at = new Date().toISOString();
    const prev = rows;
    setRows(rows.map(r => r.id === p.id ? { ...r, ...patch } as Post : r));
    const { error } = await supabase.from('posts').update(patch).eq('id', p.id);
    if (error) { setRows(prev); setErr(error.message); return; }
    logAction('updated', 'posts', p.id, `${next === 'published' ? 'Published' : 'Unpublished'} ${p.title_en}`);
    if (filter !== 'all') load();
  }

  async function remove(p: Post) {
    if (!confirm(`Remove "${p.title_en}"? It comes off your website but is not permanently erased.`)) return;
    const { error } = await supabase.from('posts')
      .update({ deleted_at: new Date().toISOString() }).eq('id', p.id);
    if (error) { setErr(error.message); return; }
    logAction('deleted', 'posts', p.id, `Removed post ${p.title_en}`);
    load();
  }

  return (
    <div className="view">
      <header className="view-head">
        <h1>Blog</h1>
        <p>Job stories bring in local searches. A post about a real kitchen in a real town
           beats a general article about countertops every time.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      <div className="toolbar">
        <div className="chips-row">
          {(['all','draft','published'] as const).map(f => (
            <button key={f} className={'chip' + (filter === f ? ' on' : '')} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <Link className="btn accent" to="/admin/blog/new">Write a post</Link>
      </div>

      {loading ? <p className="muted">Loading</p>
        : rows.length === 0 ? (
        <div className="empty">
          <h2>No posts yet</h2>
          <p>Write about a job you just finished — the town, the stone, what the customer needed.
             That is what people in DeBary and Deltona actually search for.</p>
          <Link className="btn accent" to="/admin/blog/new">Write your first post</Link>
        </div>
      ) : (
        <ul className="rows">
          {rows.map(p => (
            <li key={p.id} className="row-card">
              <div className="row-main">
                <div className="row-who">
                  <strong>{p.title_en || 'Untitled'}</strong>
                  <span className="meta">
                    {[p.city, p.materials?.[0], p.published_at ? shortDate(p.published_at) : 'Not published']
                      .filter(Boolean).join(' · ')}
                  </span>
                </div>
                <span className={'pill ' + (p.status === 'published' ? 's-won' : 's-new')}>{p.status}</span>
                <div className="row-actions inline">
                  <Link className="btn ghost sm" to={`/admin/blog/${p.id}`}>Edit</Link>
                  <button className="btn ghost sm" onClick={() => toggle(p)}>
                    {p.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button className="btn ghost sm danger-text" onClick={() => remove(p)}>Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
