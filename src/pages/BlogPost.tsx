import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useContent } from '../lib/SiteContentProvider';
import { Markdown } from '../lib/markdown';
import { shortDate } from '../lib/money';
import Header from '../components/site/Header';
import Footer from '../components/site/Footer';
import type { Post } from '../lib/types';

export default function BlogPost() {
  const { slug } = useParams();
  const { lang } = useContent();
  const [p, setP] = useState<Post | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase.from('posts').select('*').eq('slug', slug).eq('status','published').maybeSingle()
      .then(({ data }) => { data ? setP(data as Post) : setMissing(true); });
  }, [slug]);

  const pick = (en: string | null | undefined, es: string | null | undefined) =>
    (lang === 'es' ? (es || en) : en) ?? '';

  /* Title and description are set on the document rather than rendered,
     so search engines and shares pick them up. */
  useEffect(() => {
    if (!p) return;
    const title = pick(p.seo_title_en || p.title_en, p.seo_title_es || p.title_es);
    document.title = `${title} | Santiago's Granite & Quartz`;
    const desc = pick(p.meta_description_en || p.excerpt_en, p.meta_description_es || p.excerpt_es);
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name','description'); document.head.appendChild(tag); }
    tag.setAttribute('content', desc);
  }, [p, lang]);

  if (missing) return (
    <div className="site"><Header />
      <section className="section"><div className="band-in narrow">
        <div className="empty">
          <h2>{lang === 'es' ? 'No encontramos esa página' : 'We could not find that page'}</h2>
          <Link className="btn accent" to="/blog">{lang === 'es' ? 'Ver todo' : 'See all posts'}</Link>
        </div>
      </div></section>
      <Footer />
    </div>
  );

  if (!p) return <div className="site"><Header /><section className="section">
    <div className="band-in narrow"><p className="muted">Loading</p></div></section><Footer /></div>;

  return (
    <div className="site">
      <Header />
      <article className="section">
        <div className="band-in narrow">
          <Link className="back-to" to="/blog">{lang === 'es' ? 'Todos los trabajos' : 'All posts'}</Link>
          <h1 className="post-title">{pick(p.title_en, p.title_es)}</h1>
          <p className="meta post-meta">
            {[p.city, p.county ? p.county + ' County' : null,
              p.published_at ? shortDate(p.published_at) : null].filter(Boolean).join(' · ')}
          </p>
          {p.materials?.length > 0 && (
            <ul className="mat-tags">{p.materials.map(m => <li key={m}>{m}</li>)}</ul>
          )}
          <Markdown source={pick(p.body_en, p.body_es)} />

          <div className="post-cta">
            <h3>{lang === 'es' ? '¿Listo para su cocina?' : 'Thinking about your kitchen?'}</h3>
            <Link className="btn accent" to="/#quote">
              {lang === 'es' ? 'Solicite un estimado gratis' : 'Get a free estimate'}
            </Link>
          </div>
        </div>
      </article>
      <Footer />
    </div>
  );
}
