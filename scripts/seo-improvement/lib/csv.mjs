/**
 * Parser CSV mínimo conforme a RFC 4180: campos entre comillas con comas, comillas dobles
 * escapadas ("") y saltos de línea dentro de comillas. Elimina el BOM UTF-8 inicial.
 * Sin dependencias, para no añadir paquetes al proyecto solo por los scripts de evidencia.
 */
export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Devuelve { header, records } con cada registro como objeto header→valor. */
export function parseCsvObjects(text) {
  const rows = parseCsv(text);
  const [header = [], ...data] = rows;
  const records = data
    .filter((r) => !(r.length === 1 && r[0] === ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
  return { header, records };
}

/** "2,55%" / "2.55%" / "" → número o null. Blanco nunca se convierte en cero. */
export function toNumber(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim().replace('%', '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
