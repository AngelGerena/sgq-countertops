import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/audit';
import { parseContactFile, normalizePhone, type ImportedContact } from '../lib/contactImport';
import type { Customer } from '../lib/types';

/* Import contacts from a phone export (.vcf) or a spreadsheet (.csv).
   Guard rails for Cesar: he always sees a preview of exactly who is coming in,
   duplicates are skipped automatically, and nothing saves until he confirms. */

type Props = { existing: Customer[]; onDone: () => void; onClose: () => void };
type Stage = 'pick' | 'preview' | 'saving' | 'done';

export default function CustomerImport({ existing, onDone, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('pick');
  const [contacts, setContacts] = useState<ImportedContact[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [skipped, setSkipped] = useState(0);
  const [saved, setSaved] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<'android' | 'iphone' | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setErr(null);
    if (f.size > 15 * 1024 * 1024) {
      setErr('That file is too big. Export contacts only, not photos.');
      return;
    }
    const text = await f.text();
    const parsed = parseContactFile(f.name, text);
    if (parsed.length === 0) {
      setErr("We couldn't find any contacts in that file. Use a .vcf file from your phone or a .csv from Google Contacts — the instructions below show how.");
      return;
    }
    // Skip contacts already in the customer list (same phone or same email)
    const knownPhones = new Set(existing.map(c => normalizePhone(c.phone)).filter(Boolean));
    const knownEmails = new Set(existing.map(c => (c.email ?? '').toLowerCase()).filter(Boolean));
    const seen = new Set<string>();
    const fresh: ImportedContact[] = [];
    let dupes = 0;
    for (const c of parsed) {
      const p = normalizePhone(c.phone);
      const e = (c.email ?? '').toLowerCase();
      const key = p || e || c.name.toLowerCase();
      if ((p && knownPhones.has(p)) || (e && knownEmails.has(e)) || seen.has(key)) { dupes++; continue; }
      seen.add(key);
      fresh.push(c);
    }
    setSkipped(dupes);
    setContacts(fresh);
    setChecked(fresh.map(() => true));
    setStage(fresh.length ? 'preview' : 'pick');
    if (!fresh.length) setErr(`All ${dupes} contacts in that file are already in your customer list. Nothing to import.`);
  }

  async function confirm() {
    const picks = contacts.filter((_, i) => checked[i]);
    if (picks.length === 0) { setErr('Tick at least one contact to import.'); return; }
    setStage('saving'); setErr(null);
    const payload = picks.map(c => ({
      name: c.name, phone: c.phone, email: c.email,
      address: c.address, city: c.city, zip: c.zip, lang: 'en',
      notes: 'Imported from phone contacts',
    }));
    // Insert in batches of 100 so big phone books don't choke
    let ok = 0;
    for (let i = 0; i < payload.length; i += 100) {
      const batch = payload.slice(i, i + 100);
      const { error } = await supabase.from('customers').insert(batch);
      if (error) {
        setErr(ok > 0
          ? `Saved ${ok} contacts, then something went wrong. Try the file again — the ones already saved will be skipped.`
          : 'Could not save the contacts. Check your connection and try again.');
        setStage('preview');
        if (ok > 0) onDone();
        return;
      }
      ok += batch.length;
    }
    logAction('created', 'customers', null, `Imported ${ok} customers from contacts file`);
    setSaved(ok);
    setStage('done');
    onDone();
  }

  const pickedCount = checked.filter(Boolean).length;
  const toggleAll = (on: boolean) => setChecked(contacts.map(() => on));

  return (
    <section className="panel editor import-panel">
      <div className="panel-head">
        <h2>Bring in your phone contacts</h2>
      </div>
      <div className="panel-body">
        {err && <div className="notice err-notice">{err}</div>}

        {stage === 'pick' && (
          <>
            <p className="import-lede">
              Pick the contacts file from your phone or computer. We show you exactly
              who will be added before anything saves, and people already in your
              list are skipped automatically.
            </p>
            <input ref={fileRef} type="file" accept=".vcf,.csv,text/vcard,text/csv"
              className="sr-only" id="import-file"
              onChange={e => onFile(e.target.files?.[0])} />
            <button className="btn accent" onClick={() => fileRef.current?.click()}>
              Choose contacts file (.vcf or .csv)
            </button>

            <div className="import-help">
              <h3>How to get the file off the phone</h3>
              <div className="import-help-tabs">
                <button className={'chip' + (showHelp === 'android' ? ' on' : '')}
                  onClick={() => setShowHelp(showHelp === 'android' ? null : 'android')}>
                  Android
                </button>
                <button className={'chip' + (showHelp === 'iphone' ? ' on' : '')}
                  onClick={() => setShowHelp(showHelp === 'iphone' ? null : 'iphone')}>
                  iPhone
                </button>
              </div>

              {showHelp === 'android' && (
                <ol className="import-steps">
                  <li>Open the <strong>Contacts</strong> app (the one with the person icon).</li>
                  <li>Tap the <strong>menu</strong> (three lines or three dots), then <strong>Settings</strong>.</li>
                  <li>Tap <strong>Export</strong> (on Samsung: Manage contacts &rarr; Import/Export &rarr; Export).</li>
                  <li>Choose <strong>Export to .vcf file</strong> and save it. That one file holds everyone.</li>
                  <li>Send that file to this computer &mdash; email it to yourself, or WhatsApp it to your own number and download it here.</li>
                  <li>Come back to this page and press the gold button above.</li>
                </ol>
              )}
              {showHelp === 'iphone' && (
                <ol className="import-steps">
                  <li>On the iPhone, open <strong>Contacts</strong> and tap <strong>Lists</strong> (top left).</li>
                  <li>Press and hold <strong>All Contacts</strong>, then tap <strong>Export</strong>.</li>
                  <li>It creates one <strong>.vcf</strong> file with everyone &mdash; choose <strong>Mail</strong> and email it to yourself.</li>
                  <li>On older iPhones without that option: go to <strong>icloud.com/contacts</strong> on a computer, sign in, select all (Ctrl&nbsp;+&nbsp;A), click the gear &rarr; <strong>Export vCard</strong>.</li>
                  <li>Download the file on this computer, come back here, and press the gold button above.</li>
                </ol>
              )}
              <p className="muted small">
                Also works with a .csv spreadsheet from Google Contacts
                (contacts.google.com &rarr; Export) or Outlook.
              </p>
            </div>
          </>
        )}

        {stage === 'preview' && (
          <>
            <p className="import-lede">
              <strong>{contacts.length}</strong> new {contacts.length === 1 ? 'contact' : 'contacts'} found
              {skipped > 0 && <> &middot; {skipped} already in your list (skipped)</>}.
              Untick anyone you don&rsquo;t want, then confirm.
            </p>
            <div className="import-bulk">
              <button className="btn ghost sm" onClick={() => toggleAll(true)}>Select all</button>
              <button className="btn ghost sm" onClick={() => toggleAll(false)}>Select none</button>
            </div>
            <div className="import-table-wrap">
              <table className="import-table">
                <thead>
                  <tr><th></th><th>Name</th><th>Phone</th><th>Email</th><th>City</th></tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={i} className={checked[i] ? '' : 'off'}>
                      <td>
                        <input type="checkbox" checked={checked[i]}
                          aria-label={`Import ${c.name}`}
                          onChange={() => setChecked(ch => ch.map((v, j) => j === i ? !v : v))} />
                      </td>
                      <td>{c.name}</td>
                      <td>{c.phone ?? <span className="muted">&mdash;</span>}</td>
                      <td>{c.email ?? <span className="muted">&mdash;</span>}</td>
                      <td>{c.city ?? <span className="muted">&mdash;</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row-actions">
              <button className="btn accent" onClick={confirm}>
                Add {pickedCount} {pickedCount === 1 ? 'customer' : 'customers'}
              </button>
              <button className="btn ghost" onClick={() => { setStage('pick'); setContacts([]); }}>
                Pick a different file
              </button>
            </div>
          </>
        )}

        {stage === 'saving' && <p className="muted">Saving your contacts&hellip;</p>}

        {stage === 'done' && (
          <>
            <p className="import-lede">
              Done! <strong>{saved}</strong> {saved === 1 ? 'customer' : 'customers'} added to your list.
            </p>
            <div className="row-actions">
              <button className="btn accent" onClick={onClose}>Back to customers</button>
            </div>
          </>
        )}

        {stage !== 'done' && stage !== 'saving' && (
          <div className="row-actions import-close">
            <button className="btn ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </section>
  );
}
