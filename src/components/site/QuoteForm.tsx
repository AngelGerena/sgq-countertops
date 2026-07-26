import { useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { useContent } from '../../lib/SiteContentProvider';

export default function QuoteForm() {
  const { t, lang } = useContent();
  const [f, setF] = useState({ name: '', email: '', phone: '', city: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;                       // guards the double-tap
    setBusy(true); setErr(null);
    const { error } = await supabase.from('leads').insert({
      name: f.name.trim(),
      email: f.email.trim() || null,
      phone: f.phone.trim() || null,
      city: f.city.trim() || null,
      message: f.message.trim() || null,
      source: 'website'
    });
    setBusy(false);
    if (error) {
      setErr(lang === 'es'
        ? 'No se pudo enviar. Llámenos y con gusto le atendemos.'
        : 'That did not send. Give us a call and we will take care of you.');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <section className="section" id="quote">
        <div className="band-in narrow">
          <div className="thanks">
            <h2>{t('quote.success', 'Thank you. Cesar will call you shortly.',
                                    'Gracias. Cesar le llamará en breve.')}</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section" id="quote">
      <div className="band-in narrow">
        <h2>{t('quote.title', 'Get a free estimate', 'Solicite un estimado gratis')}</h2>
        <p className="band-lede">
          {t('quote.intro', 'Tell us about the room. Cesar will call you back, usually same day.',
                            'Cuéntenos sobre el espacio. Cesar le devolverá la llamada, normalmente el mismo día.')}
        </p>

        <form className="quote-form" onSubmit={submit}>
          {err && <div className="form-err">{err}</div>}

          <div className="fr">
            <label htmlFor="q-name">{lang === 'es' ? 'Nombre' : 'Name'}</label>
            <input id="q-name" required value={f.name}
              onChange={e => setF({ ...f, name: e.target.value })} />
          </div>
          <div className="fr two">
            <div>
              <label htmlFor="q-phone">{lang === 'es' ? 'Teléfono' : 'Phone'}</label>
              <input id="q-phone" type="tel" value={f.phone}
                onChange={e => setF({ ...f, phone: e.target.value })} />
            </div>
            <div>
              <label htmlFor="q-email">{lang === 'es' ? 'Correo' : 'Email'}</label>
              <input id="q-email" type="email" value={f.email}
                onChange={e => setF({ ...f, email: e.target.value })} />
            </div>
          </div>
          <div className="fr">
            <label htmlFor="q-city">{lang === 'es' ? 'Ciudad' : 'City'}</label>
            <input id="q-city" value={f.city}
              onChange={e => setF({ ...f, city: e.target.value })} />
          </div>
          <div className="fr">
            <label htmlFor="q-msg">{lang === 'es' ? '¿Qué necesita?' : 'What do you need?'}</label>
            <textarea id="q-msg" value={f.message}
              onChange={e => setF({ ...f, message: e.target.value })} />
          </div>

          <button className="btn gold block" type="submit" disabled={busy}>
            {busy ? (lang === 'es' ? 'Enviando' : 'Sending')
                  : (lang === 'es' ? 'Enviar' : 'Send request')}
          </button>
        </form>
      </div>
    </section>
  );
}
