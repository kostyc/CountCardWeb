/**
 * Minimal logger for shared packages (no PII).
 */

export function logInfo(_message: string, _context?: string): void {
  // Intentionally quiet in shared packages; apps may override via bundler alias.
}

export function logWarning(_message: string, _context?: string): void {}

export function logError(error: Error, _context?: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.message);
  }
}
