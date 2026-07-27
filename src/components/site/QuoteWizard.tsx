import { useMemo, useRef, useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useContent } from '../../lib/SiteContentProvider';

/* Four small screens instead of one long form. Selections travel in the
   message column so the admin Leads module needs no schema change. */

type Answers = {
  project: string | null;
  material: string | null;
  timing: string | null;
};

export default function QuoteWizard() {
  const { t, lang } = useContent();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Answers>({ project: null, material: null, timing: null });
  const [f, setF] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hp, setHp] = useState('');
  const openedAt = useRef(Date.now());

  const projects = useMemo(() => ([
    { k: 'kitchen',   en: 'Kitchen countertops', es: 'Encimeras de cocina' },
    { k: 'bathroom',  en: 'Bathroom vanity',     es: 'Tocador de baño' },
    { k: 'cabinets',  en: 'Cabinets',            es: 'Gabinetes' },
    { k: 'other',     en: 'Something else',      es: 'Otro proyecto' }
  ]), []);
  const materials = useMemo(() => ([
    { k: 'granite',   en: 'Granite',        es: 'Granito' },
    { k: 'quartz',    en: 'Quartz',         es: 'Cuarzo' },
    { k: 'quartzite', en: 'Quartzite',      es: 'Cuarcita' },
    { k: 'unsure',    en: 'Help me choose', es: 'Ayúdeme a elegir' }
  ]), []);
  const timings = useMemo(() => ([
    { k: 'asap',     en: 'As soon as possible', es: 'Lo antes posible' },
    { k: 'month',    en: 'Within a month',      es: 'Dentro de un mes' },
    { k: 'planning', en: 'Just planning',       es: 'Solo planeando' }
  ]), []);

  const total = 4;
  const pct = ((step + 1) / total) * 100;
  const L = (en: string, es: string) => (lang === 'es' ? es : en);

  function pick(field: keyof Answers, value: string) {
    setAns(a => ({ ...a, [field]: value }));
    setStep(s => Math.min(s + 1, total - 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    /* spam gates: hidden field filled, or submitted inhumanly fast */
    if (hp.trim() !== '' || Date.now() - openedAt.current < 3000) { setDone(true); return; }
    setBusy(true); setErr(null);

    const label = (list: { k: string; en: string; es: string }[], k: string | null) =>
      list.find(x => x.k === k)?.en ?? '—';
    const summary =
      `[Quote wizard] Project: ${label(projects, ans.project)} · ` +
      `Material: ${label(materials, ans.material)} · ` +
      `Timing: ${label(timings, ans.timing)}` +
      (f.message.trim() ? `\n${f.message.trim()}` : '');

    const { error } = await supabase.from('leads').insert({
      name: f.name.trim(),
      email: f.email.trim() || null,
      phone: f.phone.trim() || null,
      city: f.city.trim() || null,
      message: summary,
      source: 'website'
    });
    setBusy(false);
    if (error) {
      setErr(L('That did not send. Give us a call and we will take care of you.',
               'No se pudo enviar. Llámenos y con gusto le atendemos.'));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="section" id="quote">
        <div className="band-in narrow">
          <div className="thanks reveal in">
            <h2>{t('quote.success', 'Thank you. Cesar will call you shortly.',
                                    'Gracias. Cesar le llamará en breve.')}</h2>
            <p>{L('Usually the same day, often within the hour.',
                  'Normalmente el mismo día, muchas veces dentro de la hora.')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="quote">
      <div className="band-in narrow">
        <span className="eyebrow reveal">{L('Free estimate', 'Estimado gratis')}</span>
        <h2 className="reveal">{t('quote.title', 'Get a free estimate', 'Solicite un estimado gratis')}</h2>
        <p className="band-lede reveal">
          {t('quote.intro', 'Four quick questions. Cesar calls you back, usually same day.',
                            'Cuatro preguntas rápidas. Cesar le devuelve la llamada, normalmente el mismo día.')}
        </p>

        <div className="wiz-wrap reveal">
          <div className="wiz-bar"><i style={{ width: pct + '%' }} /></div>
          <div className="wiz-body">

            {step === 0 && (
              <>
                <span className="wiz-step-label">{L('Step 1 of 4', 'Paso 1 de 4')}</span>
                <h3 className="wiz-q">{L('What are we building?', '¿Qué vamos a hacer?')}</h3>
                <div className="wiz-opts">
                  {projects.map(o => (
                    <button type="button" key={o.k}
                      className={'wiz-opt' + (ans.project === o.k ? ' on' : '')}
                      onClick={() => pick('project', o.k)}>
                      {L(o.en, o.es)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <span className="wiz-step-label">{L('Step 2 of 4', 'Paso 2 de 4')}</span>
                <h3 className="wiz-q">{L('Which stone are you leaning toward?', '¿Qué piedra le interesa?')}</h3>
                <div className="wiz-opts">
                  {materials.map(o => (
                    <button type="button" key={o.k}
                      className={'wiz-opt' + (ans.material === o.k ? ' on' : '')}
                      onClick={() => pick('material', o.k)}>
                      {L(o.en, o.es)}
                    </button>
                  ))}
                </div>
                <div className="wiz-nav">
                  <button type="button" className="wiz-back" onClick={() => setStep(0)}>
                    ← {L('Back', 'Atrás')}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <span className="wiz-step-label">{L('Step 3 of 4', 'Paso 3 de 4')}</span>
                <h3 className="wiz-q">{L('When would you like it done?', '¿Para cuándo lo necesita?')}</h3>
                <div className="wiz-opts">
                  {timings.map(o => (
                    <button type="button" key={o.k}
                      className={'wiz-opt' + (ans.timing === o.k ? ' on' : '')}
                      onClick={() => pick('timing', o.k)}>
                      {L(o.en, o.es)}
                    </button>
                  ))}
                </div>
                <div className="wiz-nav">
                  <button type="button" className="wiz-back" onClick={() => setStep(1)}>
                    ← {L('Back', 'Atrás')}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <form onSubmit={submit}>
                <span className="wiz-step-label">{L('Step 4 of 4', 'Paso 4 de 4')}</span>
                <h3 className="wiz-q">{L('Where should Cesar call?', '¿A dónde llama Cesar?')}</h3>
                {err && <div className="form-err">{err}</div>}

                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="q-company">Company</label>
                  <input id="q-company" tabIndex={-1} autoComplete="off"
                    value={hp} onChange={e => setHp(e.target.value)} />
                </div>

                <div className="fr">
                  <label htmlFor="q-name">{L('Name', 'Nombre')}</label>
                  <input id="q-name" required autoComplete="name" value={f.name}
                    onChange={e => setF({ ...f, name: e.target.value })} />
                </div>
                <div className="fr two">
                  <div>
                    <label htmlFor="q-phone">{L('Phone', 'Teléfono')}</label>
                    <input id="q-phone" type="tel" required autoComplete="tel" value={f.phone}
                      onChange={e => setF({ ...f, phone: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="q-email">{L('Email (optional)', 'Correo (opcional)')}</label>
                    <input id="q-email" type="email" autoComplete="email" value={f.email}
                      onChange={e => setF({ ...f, email: e.target.value })} />
                  </div>
                </div>
                <div className="fr">
                  <label htmlFor="q-city">{L('City', 'Ciudad')}</label>
                  <input id="q-city" autoComplete="address-level2" value={f.city}
                    onChange={e => setF({ ...f, city: e.target.value })} />
                </div>
                <div className="fr">
                  <label htmlFor="q-msg">{L('Anything else? (optional)', '¿Algo más? (opcional)')}</label>
                  <textarea id="q-msg" value={f.message}
                    onChange={e => setF({ ...f, message: e.target.value })} />
                </div>

                <div className="wiz-nav">
                  <button type="button" className="wiz-back" onClick={() => setStep(2)}>
                    ← {L('Back', 'Atrás')}
                  </button>
                  <button className="btn gold" type="submit" disabled={busy}>
                    {busy ? L('Sending…', 'Enviando…') : L('Send my request', 'Enviar solicitud')}
                  </button>
                </div>
                <p className="wiz-hint">
                  {L('No spam, no pressure. Your info goes straight to Cesar and nowhere else.',
                     'Sin spam, sin presión. Su información va directo a Cesar y a nadie más.')}
                </p>
              </form>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
