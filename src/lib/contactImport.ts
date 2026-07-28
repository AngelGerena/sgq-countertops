/* Parse phone-exported contact files into customer rows.
   Two formats cover every phone on earth:
   - .vcf (vCard 2.1/3.0/4.0) — what Android and iPhone actually export
   - .csv — what Google Contacts / Outlook export from the computer
   No dependencies; both parsers are small and defensive. */

export type ImportedContact = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
};

/* ---------- shared helpers ---------- */

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) return d.slice(1);
  return d.length >= 7 ? d : null;
}

function prettyPhone(raw: string | null): string | null {
  const d = normalizePhone(raw);
  if (!d) return raw ? clean(raw) : null;
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw ? clean(raw) : null;
}

/* Decode QUOTED-PRINTABLE (old Android vCards use it for accents: =C3=A9 etc.) */
function decodeQP(s: string): string {
  try {
    const bytes: number[] = [];
    let i = 0;
    while (i < s.length) {
      if (s[i] === '=' && /[0-9A-Fa-f]{2}/.test(s.slice(i + 1, i + 3))) {
        bytes.push(parseInt(s.slice(i + 1, i + 3), 16)); i += 3;
      } else { bytes.push(s.charCodeAt(i)); i += 1; }
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch { return s; }
}

/* ---------- vCard ---------- */

export function parseVcf(text: string): ImportedContact[] {
  const out: ImportedContact[] = [];
  // Unfold continuation lines (RFC: lines starting with space/tab continue previous)
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);

  for (const card of cards) {
    let name = '', phone: string | null = null, email: string | null = null;
    let address: string | null = null, city: string | null = null, zip: string | null = null;
    let fallbackN = '';

    for (const line of card.split('\n')) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const rawKey = line.slice(0, idx);
      let value = line.slice(idx + 1).trim();
      const key = rawKey.split(';')[0].trim().toUpperCase();
      const params = rawKey.toUpperCase();
      if (params.includes('QUOTED-PRINTABLE')) value = decodeQP(value);

      if (key === 'FN' && !name) name = clean(value);
      else if (key === 'N' && !fallbackN) {
        const [last = '', first = '', middle = ''] = value.split(';');
        fallbackN = clean([first, middle, last].filter(Boolean).join(' '));
      }
      else if (key === 'TEL' && !phone) phone = prettyPhone(value);
      else if (key === 'EMAIL' && !email) email = clean(value).toLowerCase() || null;
      else if (key === 'ADR' && !address && !city) {
        // ADR: PO box; extended; street; locality(city); region; postal; country
        const parts = value.split(';');
        address = clean(parts[2] ?? '') || null;
        city = clean(parts[3] ?? '') || null;
        zip = clean(parts[5] ?? '') || null;
      }
    }

    const finalName = name || fallbackN;
    if (!finalName && !phone && !email) continue; // empty card
    out.push({ name: finalName || phone || email || 'Unnamed contact', phone, email, address, city, zip });
  }
  return out;
}

/* ---------- CSV ---------- */

/* RFC-4180-ish parser: handles quoted fields, embedded commas and newlines. */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQ = false;
  const src = text.replace(/^\uFEFF/, ''); // strip BOM
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}

/* Find a column by trying header aliases in order (Google, Outlook, generic).
   Exact matches first; fuzzy contains-matching only when `fuzzy` is on,
   because "name" would otherwise grab "First Name" and swallow last names. */
function col(headers: string[], aliases: string[], fuzzy = true): number {
  const h = headers.map(x => x.trim().toLowerCase());
  for (const a of aliases) {
    const i = h.indexOf(a);
    if (i >= 0) return i;
  }
  if (fuzzy) {
    for (const a of aliases) {
      const i = h.findIndex(x => x.includes(a));
      if (i >= 0) return i;
    }
  }
  return -1;
}

export function parseCsv(text: string): ImportedContact[] {
  const rows = parseCsvRows(text);
  if (rows.length < 2) return [];
  const H = rows[0];
  const get = (r: string[], i: number) => (i >= 0 && i < r.length ? clean(r[i]) : '');

  const iName = col(H, ['name', 'full name', 'display name'], false);
  const iFirst = col(H, ['first name', 'given name']);
  const iLast = col(H, ['last name', 'family name']);
  const iPhone = col(H, ['phone', 'phone 1 - value', 'mobile phone', 'primary phone', 'phone number', 'mobile']);
  const iEmail = col(H, ['e-mail address', 'email', 'e-mail 1 - value', 'e-mail']);
  const iAddr = col(H, ['street', 'address 1 - street', 'home street', 'address', 'home address']);
  const iCity = col(H, ['city', 'address 1 - city', 'home city']);
  const iZip = col(H, ['zip', 'postal code', 'address 1 - postal code', 'home postal code', 'zip code']);

  const out: ImportedContact[] = [];
  for (const r of rows.slice(1)) {
    const name = get(r, iName) || clean([get(r, iFirst), get(r, iLast)].filter(Boolean).join(' '));
    const phone = prettyPhone(get(r, iPhone) || null);
    const email = get(r, iEmail).toLowerCase() || null;
    if (!name && !phone && !email) continue;
    out.push({
      name: name || phone || email || 'Unnamed contact',
      phone, email,
      address: get(r, iAddr) || null,
      city: get(r, iCity) || null,
      zip: get(r, iZip) || null,
    });
  }
  return out;
}

/* ---------- entry point ---------- */

export function parseContactFile(fileName: string, text: string): ImportedContact[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.vcf') || /BEGIN:VCARD/i.test(text.slice(0, 500))) return parseVcf(text);
  if (lower.endsWith('.csv') || text.includes(',')) return parseCsv(text);
  return [];
}
