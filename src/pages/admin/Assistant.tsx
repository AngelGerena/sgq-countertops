import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDailyBrief, listRecentRuns, getOfficeManager } from '../../lib/agents';
import type { DailyBrief, AgentRunRow, AgentRow } from '../../lib/agents';

type Lang = 'en' | 'es';

export default function Assistant() {
  const [agent, setAgent] = useState<AgentRow | null | undefined>(undefined);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [runs, setRuns] = useState<AgentRunRow[]>([]);
  const [lang, setLang] = useState<Lang>('en');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [a, r] = await Promise.all([getOfficeManager(), listRecentRuns()]);
        setAgent(a);
        setRuns(r);
        // Show this morning's brief if one was already made today.
        const today = new Date().toDateString();
        const todays = r.find(x =>
          new Date(x.created_at).toDateString() === today && x.detail?.brief_en);
        if (todays?.detail) {
          setBrief({
            brief_en: todays.detail.brief_en ?? todays.narrative,
            brief_es: todays.detail.brief_es ?? '',
            asks: todays.detail.asks ?? [],
            stats: todays.detail.stats ?? {
              new_requests: 0, waiting_requests: 0, stale_quotes: 0,
              installs_soon: 0, jobs_owed: 0, blog_drafts: 0,
            },
            run_id: todays.id,
            generated_at: todays.created_at,
          });
        }
      } catch {
        // Never show raw database errors to the owner.
        setErr('The assistant could not be reached just now. Try again in a minute — and if it keeps happening, ask Angel.');
        setAgent(null);
      }
    })();
  }, []);

  async function fetchBrief() {
    setBusy(true); setErr(null);
    try {
      const b = await getDailyBrief();
      setBrief(b);
      setRuns(await listRecentRuns());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not get the brief.');
    } finally {
      setBusy(false);
    }
  }

  const briefText = brief ? (lang === 'en' ? brief.brief_en : (brief.brief_es || brief.brief_en)) : '';

  return (
    <div className="view">
      <header className="view-head">
        <h1>Your assistant</h1>
        <p>It watches the business and tells you what needs your attention. It never changes anything without you.</p>
      </header>

      {err && <div className="notice err-notice">{err}</div>}

      {agent === null && !err && (
        <div className="notice">Your assistant is almost ready — one last piece of setup is waiting on Angel&rsquo;s side. Nothing for you to do.</div>
      )}

      <section className="panel ai-panel">
        <div className="panel-head brief-head">
          <div>
            <h2>Today&rsquo;s brief</h2>
            <p>
              {brief
                ? `Prepared ${new Date(brief.generated_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                : 'One short read: what happened, and the few things only you can decide.'}
            </p>
          </div>
          <div className="lang-toggle" role="group" aria-label="Brief language">
            <button type="button" className={'chip' + (lang === 'en' ? ' on' : '')} onClick={() => setLang('en')}>English</button>
            <button type="button" className={'chip' + (lang === 'es' ? ' on' : '')} onClick={() => setLang('es')}>Español</button>
          </div>
        </div>
        <div className="panel-body">
          {!brief && (
            <div className="brief-empty">
              <p>No brief yet today.</p>
              <button className="btn accent" onClick={fetchBrief} disabled={busy || !agent?.enabled}>
                {busy ? 'Reading the business…' : 'Get today\u2019s brief'}
              </button>
            </div>
          )}

          {brief && (
            <>
              <p className="brief-text">{briefText}</p>

              {brief.asks.length > 0 && (
                <div className="brief-asks">
                  {brief.asks.map((a, i) => (
                    <div className="ask-card" key={i}>
                      <span className="ask-text">{lang === 'en' ? a.text_en : (a.text_es || a.text_en)}</span>
                      {a.link && <Link className="btn ghost sm" to={a.link}>{lang === 'en' ? 'Take a look' : 'Ver'}</Link>}
                    </div>
                  ))}
                </div>
              )}

              <div className="row-actions">
                <button className="btn ghost sm" onClick={fetchBrief} disabled={busy}>
                  {busy ? 'Reading the business…' : 'Refresh the brief'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>What the assistant has been doing</h2>
        </div>
        <div className="panel-body">
          {runs.length === 0 && (
            <p className="agent-log-empty">Nothing yet. Every time the assistant works, it explains itself here in plain English.</p>
          )}
          {runs.map(r => (
            <div className="agent-log-row" key={r.id}>
              <span className="agent-log-when">
                {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
              <span className="agent-log-text">{r.narrative}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="assistant-footnote">
        Your assistant is at <strong>watch-and-report</strong> level. It reads what is already in the portal,
        it never contacts customers, and it never touches money. As you get comfortable, it can earn
        permission to do more — always with your say-so.
      </p>
    </div>
  );
}
