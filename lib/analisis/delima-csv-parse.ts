/** Penghurai CSV ringkas (tulen, tanpa I/O) — dipakai import DELIMa/Ains. */

/** Pecah teks CSV kepada baris + medan (menyokong medan dalam petikan dan "" terlepas). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cur += c;
  }
  row.push(cur);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

/** "manjung" / "kuala-kangsar" → "PPD MANJUNG" / "PPD KUALA KANGSAR". */
export function namaPpd(daerahSlug: string): string {
  return `PPD ${daerahSlug.trim().replace(/[-_]+/g, " ").toUpperCase()}`;
}
