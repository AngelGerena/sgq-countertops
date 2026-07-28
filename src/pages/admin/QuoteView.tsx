import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { money, shortDate } from '../../lib/money';
import type { Quote, QuoteItem, Customer, BusinessSettings } from '../../lib/types';

/* The quote as the customer sees it: SGQ letterhead, contact info,
   line items, totals and terms. One button prints or saves as PDF. */
export default function QuoteView() {
  const { id } = useParams<{ id: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [biz, setBiz] = useState<BusinessSettings | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [q, it, s] = await Promise.all([
        supabase.from('quotes').select('*').eq('id', id).is('deleted_at', null).maybeSingle(),
        supabase.from('quote_items').select('*').eq('quote_id', id).order('sort_order'),
        supabase.from('business_settings').select('*').maybeSingle(),
      ]);
      setLoading(false);
      const bad = q.error || it.error || s.error;
      if (bad) { setErr('Could not open this quote. Try again in a minute.'); return; }
      if (!q.data) { setErr('This quote does not exist or was removed.'); return; }
      setQuote(q.data as Quote);
      setItems((it.data as QuoteItem[]) ?? []);
      setBiz(s.data as BusinessSettings);
      const custId = (q.data as Quote).customer_id;
      if (custId) {
        const { data: c } = await supabase.from('customers').select('*').eq('id', custId).maybeSingle();
        setCustomer((c as Customer) ?? null);
      }
    })();
  }, [id]);

  if (loading) return <div className="view"><p className="muted">Loading</p></div>;
  if (err || !quote) {
    return (
      <div className="view">
        {err && <div className="notice err-notice">{err}</div>}
        <Link className="btn" to="/admin/quotes">Back to quotes</Link>
      </div>
    );
  }

  const unitLabel = (u: string) => u === 'sqft' ? 'sq ft' : u === 'linear_ft' ? 'linear ft' : 'each';

  /* One-tap sending. Each opens the app Cesar already uses, message pre-written,
     addressed to the customer on file. He reads it, taps send — done. */
  const bizName = biz?.trade_name || "Santiago's Granite & Quartz";
  const digits = (customer?.phone ?? '').replace(/\D/g, '');
  const waNumber = digits.length === 10 ? `1${digits}` : digits; // US default
  const sendText = [
    `Hi ${customer?.name?.split(' ')[0] ?? 'there'}, it's ${bizName}.`,
    `Your quote ${quote.quote_number ?? ''} is ready: ${money(quote.total)} total, ${money(quote.deposit_due)} deposit to reserve your install date.`,
    quote.valid_until ? `Good through ${shortDate(quote.valid_until)}.` : '',
    biz?.phone ? `Questions? Call or text us at ${biz.phone}.` : '',
  ].filter(Boolean).join(' ');
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(sendText)}`;
  const smsHref = `sms:${customer?.phone ?? ''}?&body=${encodeURIComponent(sendText)}`;
  const emailHref = `mailto:${customer?.email ?? ''}`
    + `?subject=${encodeURIComponent(`Your quote ${quote.quote_number ?? ''} from ${bizName}`)}`
    + `&body=${encodeURIComponent(sendText + '\n\nWe can also send a printed copy — just reply to this email.')}`;

  const payLine = [
    biz?.accept_card ? 'card' : null,
    biz?.accept_ach ? (biz.ach_discount_pct > 0
      ? `bank transfer (${biz.ach_discount_pct}% discount)` : 'bank transfer') : null,
    'check', 'cash',
  ].filter(Boolean).join(', ');

  return (
    <div className="view quote-view">
      <div className="toolbar no-print">
        <Link className="btn" to="/admin/quotes">Back to quotes</Link>
        <div className="qd-actions">
          {customer?.phone && (
            <a className="btn" href={waHref} target="_blank" rel="noopener noreferrer">
              Send on WhatsApp
            </a>
          )}
          {customer?.phone && <a className="btn" href={smsHref}>Send by text</a>}
          {customer?.email && <a className="btn" href={emailHref}>Send by email</a>}
          <button className="btn accent" onClick={() => window.print()}>
            Print or save as PDF
          </button>
        </div>
      </div>

      {!customer?.phone && !customer?.email && (
        <div className="notice no-print">
          Link a customer with a phone or email to send this quote straight from here.
        </div>
      )}

      <article className="quote-doc" aria-label={`Quote ${quote.quote_number ?? ''}`}>
        <header className="qd-letterhead">
          <div className="qd-brand">
            <img src="/images/sgq-mark-64.png" alt="" width="56" height="56" />
            <div>
              <strong className="qd-name">{biz?.trade_name || "Santiago's Granite & Quartz"}</strong>
              {biz?.license_number && <span className="qd-lic">License {biz.license_number}</span>}
            </div>
          </div>
          <div className="qd-contact">
            {biz?.address && <span>{biz.address}</span>}
            {biz?.phone && <span>{biz.phone}</span>}
            {biz?.email && <span>{biz.email}</span>}
          </div>
        </header>

        <div className="qd-meta">
          <div>
            <h1>Quote {quote.quote_number ?? '(draft)'}</h1>
            <p className="qd-dates">
              Prepared {shortDate(quote.created_at)}
              {quote.valid_until && <> &middot; Good through {shortDate(quote.valid_until)}</>}
            </p>
          </div>
          <div className="qd-for">
            <span className="qd-label">Prepared for</span>
            {customer ? (
              <>
                <strong>{customer.name}</strong>
                {(customer.address || customer.city) && (
                  <span>{[customer.address, customer.city, customer.zip].filter(Boolean).join(', ')}</span>
                )}
                {customer.phone && <span>{customer.phone}</span>}
                {customer.email && <span>{customer.email}</span>}
              </>
            ) : <strong>&mdash;</strong>}
          </div>
        </div>

        <table className="qd-items">
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {items.map(l => (
              <tr key={l.id}>
                <td>{l.label}</td>
                <td>{l.qty} {unitLabel(l.unit)}</td>
                <td>{money(l.unit_price)}</td>
                <td>{money(l.line_total)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="muted">No line items on this quote.</td></tr>
            )}
          </tbody>
        </table>

        <div className="qd-totals">
          <div><span>Subtotal</span><span>{money(quote.subtotal)}</span></div>
          {quote.travel_uplift > 0 && <div><span>Travel</span><span>{money(quote.travel_uplift)}</span></div>}
          <div><span>Tax</span><span>{money(quote.tax)}</span></div>
          <div className="qd-grand"><span>Total</span><span>{money(quote.total)}</span></div>
          <div className="qd-deposit"><span>Deposit to schedule</span><span>{money(quote.deposit_due)}</span></div>
        </div>

        {quote.notes && (
          <div className="qd-notes">
            <span className="qd-label">Notes</span>
            <p>{quote.notes}</p>
          </div>
        )}

        <footer className="qd-terms">
          <p>
            A {biz?.deposit_pct ?? 50}% deposit reserves your install date; the balance is due on completion.
            We accept {payLine}. This quote covers the items listed above &mdash; anything discovered during
            template or removal is priced before work continues, never after.
          </p>
          <p className="qd-thanks">
            Thank you for considering {biz?.trade_name || "Santiago's Granite & Quartz"}.
            {biz?.phone && <> Questions? Call {biz.phone}.</>}
          </p>
        </footer>
      </article>
    </div>
  );
}
