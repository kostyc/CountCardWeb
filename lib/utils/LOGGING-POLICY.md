# Logging Policy and Retention

## Overview
This document outlines the logging policy, log rotation, and retention strategies for the CountCard web application.

## Log Levels

### Configuration
Log levels are configured via the `LOG_LEVEL` environment variable:
- `DEBUG` - Detailed diagnostic information (development only)
- `INFO` - General informational messages (default in production)
- `WARN` - Warning messages for potentially harmful situations
- `ERROR` - Error messages for serious problems

### Default Behavior
- **Development**: `DEBUG` level (all logs)
- **Production**: `INFO` level (INFO, WARN, ERROR only)

## Log Rotation

### Console Logs (Development)
- Console logs are ephemeral and not persisted
- No rotation needed for development environment

### Production Logs
For production environments, logs should be collected by a log aggregation service:

#### Recommended Services
1. **Google Cloud Logging** (recommended for Firebase projects)
   - Automatic log collection from Cloud Run/App Engine
   - Built-in log rotation and retention
   - Integrated with Google Cloud Error Reporting

2. **Vercel Logs** (if using Vercel hosting)
   - Automatic log collection
   - Built-in retention policies

3. **Third-party Services**
   - Datadog
   - New Relic
   - LogRocket
   - Sentry

### Log Rotation Strategy
When using log aggregation services:
- **Daily Rotation**: Logs are typically rotated daily by the service
- **Size-based Rotation**: Automatic rotation when log files reach size limits
- **Automatic Cleanup**: Old logs are automatically archived or deleted based on retention policies

## Retention Policies

### Recommended Retention Periods

#### Development Environment
- **Console Logs**: Ephemeral (not persisted)
- **Error Logs**: 7 days (if using error tracking service)

#### Production Environment
- **Application Logs**: 30 days
- **Error Logs**: 90 days
- **Audit Logs**: 1 year (for compliance)
- **Security Logs**: 1 year (for security monitoring)

### Implementation Notes
- Retention policies are typically configured in the log aggregation service
- Application code does not need to implement log rotation (handled by infrastructure)
- Structured logging (JSON format) enables efficient log querying and filtering

## Log Storage

### Structured Logging
All logs use structured JSON format for:
- Efficient querying and filtering
- Log aggregation and analysis
- Integration with monitoring tools

### Log Format
```json
{
  "message": "API Request: GET /api/users",
  "level": "info",
  "timestamp": "2026-01-17T10:30:00.000Z",
  "context": {
    "requestId": "req_1234567890_abc123",
    "correlationId": "req_1234567890_abc123",
    "userId": "masked_user_id",
    "method": "GET",
    "path": "/api/users"
  },
  "data": {
    "statusCode": 200,
    "duration": "45ms"
  }
}
```

## PII Protection

### Automatic Masking
All logs automatically mask:
- Email addresses
- Phone numbers (US and international)
- User IDs (Firebase UIDs)
- Social Security Numbers
- Credit card numbers
- Recruit IDs
- Passwords, tokens, keys, secrets

### Sensitive Data Handling
- Sensitive keys are completely redacted (`[REDACTED]`)
- PII is masked with partial visibility (e.g., `u***@e***.com`)
- Never log encryption keys, passwords, or recovery codes

## Log Aggregation Setup

### Google Cloud Logging
1. Enable Cloud Logging API
2. Configure log sinks for different log types
3. Set up retention policies in Cloud Logging
4. Configure alerts for error thresholds

### Vercel Logs
1. Logs are automatically collected
2. Configure retention in Vercel dashboard
3. Set up log streaming for real-time monitoring

## Monitoring and Alerts

### Recommended Alerts
- **Error Rate**: Alert when error rate exceeds threshold
- **Critical Errors**: Immediate alert for critical errors
- **Performance**: Alert for slow API responses (>1s)
- **Security**: Alert for authentication/authorization failures

### Alert Configuration
Configure alerts in your log aggregation service:
- Google Cloud Monitoring
- Vercel Analytics
- Third-party monitoring tools

## Compliance

### GDPR Compliance
- Logs do not contain PII (automatically masked)
- Log retention respects data minimization principles
- Logs can be exported for user data requests
- Logs can be deleted for user data deletion requests

### Audit Logging
- All administrative actions should be logged
- Audit logs retained for compliance period (1 year)
- Audit logs should include:
  - User ID (masked)
  - Action performed
  - Timestamp
  - Resource affected
  - Result (success/failure)

## Best Practices

1. **Use Appropriate Log Levels**
   - DEBUG: Detailed diagnostic information
   - INFO: General application flow
   - WARN: Potentially problematic situations
   - ERROR: Error events that might still allow the app to continue

2. **Include Context**
   - Always include correlation IDs for request tracking
   - Include user ID (masked) for user-specific operations
   - Include request/response metadata for API calls

3. **Structured Logging**
   - Use `logStructured()` for complex data
   - Use JSON format for log aggregation
   - Include relevant context in log entries

4. **Performance Logging**
   - Log slow operations (>500ms)
   - Use `logPerformance()` for operation timing
   - Monitor API response times

5. **Error Logging**
   - Always log errors with context
   - Use error categorization for filtering
   - Include stack traces in development only

## References
- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Vercel Logs Documentation](https://vercel.com/docs/observability/logs)
- [Structured Logging Best Practices](https://www.datadoghq.com/blog/log-management-best-practices/)
