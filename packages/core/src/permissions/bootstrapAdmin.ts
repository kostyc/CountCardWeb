/**
 * Bootstrap admin emails — grants full admin when Firebase custom claims / ADMIN_USER_IDS
 * are unavailable (e.g. expired service account). Comma-separated lowercased emails.
 */

export function parseBootstrapAdminEmails(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isBootstrapAdminEmail(
  email: string | null | undefined,
  rawList?: string
): boolean {
  if (!email) return false;
  return parseBootstrapAdminEmails(rawList).includes(email.toLowerCase());
}
