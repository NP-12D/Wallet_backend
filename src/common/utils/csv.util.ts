export function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}
