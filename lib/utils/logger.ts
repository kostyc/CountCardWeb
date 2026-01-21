/**
 * Secure Logging Utility
 * 
 * Provides secure logging with PII masking to prevent sensitive data exposure.
 * All logs are sanitized before being written.
 * Supports structured logging, log levels, context, and performance metrics.
 */

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log level hierarchy for filtering
 */
const LOG_LEVEL_HIERARCHY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Get configured log level from environment
 * Defaults to 'info' in production, 'debug' in development
 */
function getConfiguredLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (envLevel && ['debug', 'info', 'warn', 'error'].includes(envLevel)) {
    return envLevel;
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if log level should be logged based on configuration
 */
function shouldLog(level: LogLevel): boolean {
  const configuredLevel = getConfiguredLogLevel();
  return LOG_LEVEL_HIERARCHY[level] >= LOG_LEVEL_HIERARCHY[configuredLevel];
}

/**
 * Patterns for PII detection and masking
 */
const PII_PATTERNS = {
  // Email addresses (enhanced with more variations)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers (US and international formats)
  phoneUS: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
  phoneInternational: /\+\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g,
  // User IDs (Firebase UID format: 28 characters alphanumeric)
  userId: /\b[a-zA-Z0-9]{28}\b/g,
  // SSN (Social Security Number) - improved pattern
  ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  // Credit card numbers - improved pattern (13-19 digits)
  creditCard: /\b(?:\d{4}[\s-]?){3,4}\d{1,4}\b/g,
  // Recruit ID patterns (if applicable - format may vary)
  recruitId: /\b(?:REC|RECRUIT)[-_]?[A-Z0-9]{4,}\b/gi,
};

/**
 * Mask a string value, showing only first and last characters
 */
function maskValue(value: string, showStart: number = 2, showEnd: number = 2): string {
  if (value.length <= showStart + showEnd) {
    return '*'.repeat(value.length);
  }
  return value.slice(0, showStart) + '*'.repeat(value.length - showStart - showEnd) + value.slice(-showEnd);
}

/**
 * Sanitize string to remove PII
 */
export function sanitizeForLogging(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  let sanitized = input;

  // Mask email addresses (enhanced pattern)
  sanitized = sanitized.replace(PII_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    return `${maskValue(local, 1, 0)}@${maskValue(domain, 1, 0)}`;
  });

  // Mask international phone numbers first (more specific)
  sanitized = sanitized.replace(PII_PATTERNS.phoneInternational, () => '***-***-****');
  
  // Mask US phone numbers
  sanitized = sanitized.replace(PII_PATTERNS.phoneUS, () => '***-***-****');

  // Mask user IDs (Firebase UIDs)
  sanitized = sanitized.replace(PII_PATTERNS.userId, (match) => maskValue(match, 4, 4));

  // Mask SSN (improved pattern)
  sanitized = sanitized.replace(PII_PATTERNS.ssn, () => '***-**-****');

  // Mask credit card numbers (improved pattern)
  sanitized = sanitized.replace(PII_PATTERNS.creditCard, () => '****-****-****-****');

  // Mask recruit IDs
  sanitized = sanitized.replace(PII_PATTERNS.recruitId, (match) => maskValue(match, 3, 3));

  return sanitized;
}

/**
 * Sanitize object recursively to remove PII
 */
export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeForLogging(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip sensitive keys entirely
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key') ||
        lowerKey.includes('private')
      ) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }

  return obj;
}

/**
 * Log context interface
 */
export interface LogContext {
  userId?: string; // Will be masked automatically
  requestId?: string;
  correlationId?: string;
  [key: string]: unknown;
}

/**
 * Structured log data interface
 */
export interface StructuredLogData {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: LogContext;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    operation: string;
    duration: number;
    unit: 'ms' | 's';
  };
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Format log entry with timestamp and context
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  context?: string | LogContext,
  data?: unknown
): string {
  const timestamp = new Date().toISOString();
  
  // Handle both string context and LogContext object
  let contextStr = '';
  if (typeof context === 'string') {
    contextStr = context ? `[${context}]` : '';
  } else if (context && typeof context === 'object') {
    const contextParts: string[] = [];
    if (context.requestId) contextParts.push(`req:${maskValue(context.requestId, 4, 4)}`);
    if (context.correlationId) contextParts.push(`corr:${maskValue(context.correlationId, 4, 4)}`);
    if (context.userId) contextParts.push(`user:${maskValue(context.userId, 4, 4)}`);
    contextStr = contextParts.length > 0 ? `[${contextParts.join(', ')}]` : '';
  }
  
  const dataStr = data ? ` ${JSON.stringify(sanitizeObject(data))}` : '';
  return `[${timestamp}] ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
}

/**
 * Log message at specified level
 */
export function log(
  level: LogLevel,
  message: string,
  context?: string | LogContext,
  data?: unknown
): void {
  // Check if this log level should be logged
  if (!shouldLog(level)) {
    return;
  }

  const logEntry = formatLogEntry(level, sanitizeForLogging(message), context, data);
  
  switch (level) {
    case 'debug':
      console.debug(logEntry);
      break;
    case 'info':
      console.info(logEntry);
      break;
    case 'warn':
      console.warn(logEntry);
      break;
    case 'error':
      console.error(logEntry);
      break;
  }
}

/**
 * Structured logging - logs in JSON format for log aggregation
 */
export function logStructured(level: LogLevel, data: StructuredLogData): void {
  if (!shouldLog(level)) {
    return;
  }

  const structuredData: StructuredLogData = {
    ...data,
    message: sanitizeForLogging(data.message),
    timestamp: data.timestamp || new Date().toISOString(),
    context: data.context ? sanitizeObject(data.context) as LogContext : undefined,
    data: data.data ? sanitizeObject(data.data) : undefined,
  };

  const logOutput = JSON.stringify(structuredData);
  
  switch (level) {
    case 'debug':
      console.debug(logOutput);
      break;
    case 'info':
      console.info(logOutput);
      break;
    case 'warn':
      console.warn(logOutput);
      break;
    case 'error':
      console.error(logOutput);
      break;
  }
}

/**
 * Log with context (user ID, request ID, etc.)
 */
export function logWithContext(
  level: LogLevel,
  message: string,
  context: LogContext,
  data?: unknown
): void {
  log(level, message, context, data);
}

/**
 * Error categories for better error tracking
 */
export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'encryption'
  | 'database'
  | 'network'
  | 'application'
  | 'unknown';

/**
 * Categorize error based on error type and message
 */
export function categorizeError(error: Error): ErrorCategory {
  const errorName = error.name.toLowerCase();
  const errorMessage = error.message.toLowerCase();

  if (errorName.includes('auth') || errorMessage.includes('auth')) {
    return 'authentication';
  }
  if (errorName.includes('permission') || errorName.includes('forbidden') || errorMessage.includes('permission')) {
    return 'authorization';
  }
  if (errorName.includes('validation') || errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return 'validation';
  }
  if (errorName.includes('encryption') || errorMessage.includes('encryption') || errorMessage.includes('decrypt')) {
    return 'encryption';
  }
  if (errorName.includes('database') || errorName.includes('firestore') || errorMessage.includes('database')) {
    return 'database';
  }
  if (errorName.includes('network') || errorName.includes('fetch') || errorMessage.includes('network')) {
    return 'network';
  }

  return 'application';
}

/**
 * Log error with enhanced context and categorization
 */
export function logError(
  error: Error,
  context?: string | LogContext,
  level: LogLevel = 'error',
  additionalData?: unknown
): void {
  const errorCategory = categorizeError(error);
  const errorData = {
    name: error.name,
    message: error.message,
    category: errorCategory,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...(additionalData && typeof additionalData === 'object' ? additionalData : {}),
  };

  // Preserve error context
  const errorContext: LogContext = typeof context === 'object' 
    ? { ...context, errorCategory }
    : context 
      ? { requestId: context, errorCategory }
      : { errorCategory };

  log(level, `Error: ${error.name} - ${error.message}`, errorContext, errorData);
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: string, data?: unknown): void {
  log('info', message, context, data);
}

/**
 * Log warning message
 */
export function logWarning(message: string, context?: string, data?: unknown): void {
  log('warn', message, context, data);
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: string | LogContext, data?: unknown): void {
  log('debug', message, context, data);
}

/**
 * Performance logging
 */
export function logPerformance(
  operation: string,
  duration: number,
  context?: string | LogContext,
  additionalData?: unknown
): void {
  const unit = duration >= 1000 ? 's' : 'ms';
  const durationFormatted = duration >= 1000 ? (duration / 1000).toFixed(2) : duration.toFixed(2);
  
  const performanceData = {
    operation: sanitizeForLogging(operation),
    duration: durationFormatted,
    unit,
    ...(additionalData && typeof additionalData === 'object' ? additionalData : {}),
  };

  // Log as info level with performance context
  const perfContext: LogContext = typeof context === 'object'
    ? { ...context }
    : context
      ? { requestId: context }
      : {};

  logStructured('info', {
    message: `Performance: ${operation}`,
    level: 'info',
    timestamp: new Date().toISOString(),
    context: perfContext,
    performance: {
      operation: sanitizeForLogging(operation),
      duration: parseFloat(durationFormatted),
      unit,
    },
    data: additionalData,
  });
}

/**
 * Performance measurement helper
 * Returns a function that logs performance when called
 */
export function measurePerformance(
  operation: string,
  context?: string | LogContext
): () => void {
  const startTime = Date.now();
  
  return () => {
    const duration = Date.now() - startTime;
    logPerformance(operation, duration, context);
  };
}
