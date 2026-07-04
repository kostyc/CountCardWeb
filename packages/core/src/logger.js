"use strict";
/**
 * Minimal logger for shared packages (no PII).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logWarning = logWarning;
exports.logError = logError;
function logInfo(_message, _context) {
    // Intentionally quiet in shared packages; apps may override via bundler alias.
}
function logWarning(_message, _context) { }
function logError(error, _context) {
    if (process.env.NODE_ENV !== 'production') {
        console.error(error.message);
    }
}
//# sourceMappingURL=logger.js.map