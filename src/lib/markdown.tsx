import { ReactNode } from 'react';

/* Small markdown renderer that returns React nodes rather than raw HTML,
   so there is no dangerouslySetInnerHTML anywhere in the public site. */

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={keyBase + i}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith('[')) {
      const label = tok.slice(1, tok.indexOf(']'));
      const href = tok.slice(tok.indexOf('(') + 1, -1);
      const external = /^https?:/.test(href);
      out.push(
        <a key={keyBase + i} href={href}
           {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>
      );
    } else out.push(<em key={keyBase + i}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length; i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = (source ?? '').replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        const t = b.trim();
        if (!t) return null;
        if (t.startsWith('### ')) return <h3 key={i}>{inline(t.slice(4), 'h' + i)}</h3>;
        if (t.startsWith('## '))  return <h2 key={i}>{inline(t.slice(3), 'h' + i)}</h2>;
        if (t.startsWith('> '))
          return <blockquote key={i}>{inline(t.replace(/^> ?/gm, ''), 'q' + i)}</blockquote>;
        if (/^[-*] /.test(t)) {
          const items = t.split('\n').filter(l => /^[-*] /.test(l)).map(l => l.slice(2));
          return <ul key={i}>{items.map((it, j) => <li key={j}>{inline(it, `l${i}-${j}`)}</li>)}</ul>;
        }
        if (/^\d+\. /.test(t)) {
          const items = t.split('\n').filter(l => /^\d+\. /.test(l)).map(l => l.replace(/^\d+\. /, ''));
          return <ol key={i}>{items.map((it, j) => <li key={j}>{inline(it, `o${i}-${j}`)}</li>)}</ol>;
        }
        return <p key={i}>{inline(t, 'p' + i)}</p>;
      })}
    </div>
  );
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
