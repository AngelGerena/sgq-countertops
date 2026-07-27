import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useContent } from '../lib/SiteContentProvider';
import { shortDate } from '../lib/money';
import Header from '../components/site/Header';
import Footer from '../components/site/Footer';
import type { Post } from '../lib/types';

export default function BlogIndex() {
  const { lang } = useContent();
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('posts').select('*').eq('status','published')
      .order('published_at', { ascending: false })
      .then(({ data }) => { setRows((data as Post[]) ?? []); setLoading(false); });
  }, []);

  const pick = (en: string | null | undefined, es: string | null | undefined) =>
    (lang === 'es' ? (es || en) : en) ?? '';

  return (
    <div className="site">
      <Header />
      <section className="section">
        <div className="band-in">
          <h2>{lang === 'es' ? 'Trabajos recientes' : 'From the shop'}</h2>
          <p className="band-lede">
            {lang === 'es'
              ? 'Cocinas reales en el Centro de Florida, contadas por quien hizo el trabajo.'
              : 'Real kitchens across Central Florida, written by the man who did the work.'}
          </p>

          {loading ? <p className="muted" style={{ textAlign:'center' }}>Loading</p>
            : rows.length === 0 ? (
            <div className="empty" style={{ marginTop: 28 }}>
              <h2>{lang === 'es' ? 'Nada publicado todavía' : 'Nothing published yet'}</h2>
              <p>{lang === 'es' ? 'Vuelva pronto.' : 'Check back soon.'}</p>
            </div>
          ) : (
            <div className="post-grid">
              {rows.map(p => (
                <article className="post-card" key={p.id}>
                  <Link to={`/blog/${p.slug}`}>
                    <h3>{pick(p.title_en, p.title_es)}</h3>
                    <p className="meta">
                      {[p.city, p.published_at ? shortDate(p.published_at) : null].filter(Boolean).join(' · ')}
                    </p>
                    <p className="post-exc">{pick(p.excerpt_en, p.excerpt_es)}</p>
                    <span className="read-more">
                      {lang === 'es' ? 'Leer más' : 'Read more'}
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
