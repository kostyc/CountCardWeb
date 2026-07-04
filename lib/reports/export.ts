/**
 * Shared report export helpers (CSV escape, etc.).
 * Used by report pages and server-side report builders for consistent export behavior.
 */

export function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function rowsToCsv(header: string[], rows: (string | number)[][]): string {
  const all = [header, ...rows];
  return all
    .map((row) => row.map((cell) => escapeCsv(String(cell))).join(','))
    .join('\r\n');
}
