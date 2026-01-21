# Debug Logging Guide

## Overview

The CountCard application includes a comprehensive browser debug logging system that works in Chrome, Safari, Edge, and can be viewed through browser developer tools or a visual debug panel.

## Features

- ✅ **Browser Console Logging** - All logs appear in browser console (Chrome DevTools, Safari Web Inspector)
- ✅ **Visual Debug Panel** - Optional floating panel with real-time logs
- ✅ **Keyboard Shortcut** - Toggle panel with `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
- ✅ **Log Filtering** - Filter by log level (debug, info, warn, error)
- ✅ **Log Export** - Export logs as JSON
- ✅ **PII Masking** - Automatically masks sensitive data
- ✅ **Performance Logging** - Track operation timing

## Enabling Debug Logging

### Method 1: Environment Variable (Recommended)

Add to your `.env.local` file:

```env
# Enable debug logging
NEXT_PUBLIC_DEBUG=true

# Enable visual debug panel
NEXT_PUBLIC_DEBUG_PANEL=true
```

### Method 2: Browser Console

Open browser console and run:

```javascript
// Enable debug logging
window.__DEBUG__ = true;

// Enable debug panel
window.__DEBUG_PANEL__ = true;

// Reload the page
location.reload();
```

### Method 3: URL Parameter (Development Only)

Add `?debug=true` to the URL:

```
http://localhost:3000?debug=true
```

## Using the Debug Panel

### Opening the Panel

1. **Keyboard Shortcut**: Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
2. **Browser Console**: Run `window.debugLog.togglePanel()`
3. **Auto-open**: Set `NEXT_PUBLIC_DEBUG_PANEL=true` in environment variables

### Panel Features

- **Header**: Shows "🔍 Debug Panel" with Clear and Close buttons
- **Logs Area**: Scrollable list of all debug logs
- **Filters**: Checkboxes to filter by log level
- **Draggable**: Click and drag the header to move the panel
- **Auto-scroll**: Automatically scrolls to newest logs

### Log Levels

- 🔍 **Debug** (Gray) - Detailed diagnostic information
- ℹ️ **Info** (Blue) - General informational messages
- ⚠️ **Warn** (Orange) - Warning messages
- ❌ **Error** (Red) - Error messages with stack traces

## Using Debug Logging in Code

### Basic Usage

```typescript
import { debugLog } from '@/lib/utils/debugLogger';

// Debug level
debugLog.debug('Component mounted', 'MyComponent', { userId: '123' });

// Info level
debugLog.info('User logged in', 'Auth', { email: 'user@example.com' });

// Warning level
debugLog.warn('API response slow', 'API', { duration: 1500 });

// Error level
debugLog.error('Failed to load data', 'DataService', { error: err });
```

### In React Components

```typescript
'use client';

import { useEffect } from 'react';
import { debugLog } from '@/lib/utils/debugLogger';

export function MyComponent() {
  useEffect(() => {
    debugLog.info('MyComponent mounted', 'MyComponent');
    
    return () => {
      debugLog.info('MyComponent unmounted', 'MyComponent');
    };
  }, []);

  return <div>My Component</div>;
}
```

### Using the Debug Hook

```typescript
'use client';

import { useDebugInfo } from '@/components/debug/DebugPanel';

export function MyComponent(props: MyComponentProps) {
  useDebugInfo('MyComponent', props);
  
  return <div>My Component</div>;
}
```

## Browser Console Access

All debug logs also appear in the browser console. Open developer tools:

- **Chrome/Edge**: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Safari**: `Cmd+Option+I` (enable Developer menu in Preferences first)

### Console Commands

```javascript
// Toggle debug panel
window.debugLog.togglePanel();

// Clear all logs
window.debugLog.clear();

// Export logs as JSON
const logs = window.debugLog.export();
console.log(logs);

// Get debug logger instance
const logger = window.__DEBUG_LOGGER__;
logger.getLogs(); // Get all logs
logger.clearLogs(); // Clear logs
logger.exportLogs(); // Export as JSON
```

## Log Format

Each log entry includes:

- **Timestamp** - When the log was created
- **Level** - Log level (debug, info, warn, error)
- **Message** - Log message
- **Context** - Component/service name
- **Data** - Additional data (object, array, etc.)
- **Stack Trace** - For error logs

### Example Log Entry

```json
{
  "id": "1705512345678-abc123",
  "timestamp": "2026-01-17T12:34:56.789Z",
  "level": "info",
  "message": "User logged in",
  "context": "AuthContext",
  "data": {
    "userId": "abc***xyz",
    "email": "u***@e***.com"
  }
}
```

## Filtering Logs

### In Debug Panel

Use the checkboxes at the bottom of the panel to filter by log level:
- ✅ Debug
- ✅ Info
- ✅ Warn
- ✅ Error

### In Browser Console

Use browser console filters:
- **Chrome**: Click filter icon, select log level
- **Safari**: Use filter dropdown in Web Inspector

## Exporting Logs

### From Debug Panel

1. Open debug panel
2. Click "Clear" button (logs are stored in memory)
3. Run in console: `window.debugLog.export()`
4. Copy the JSON output

### From Browser Console

```javascript
// Export all logs
const logs = window.debugLog.export();
console.log(logs);

// Copy to clipboard (Chrome/Edge)
copy(window.debugLog.export());

// Save to file
const blob = new Blob([window.debugLog.export()], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'debug-logs.json';
a.click();
```

## Performance Logging

Track operation performance:

```typescript
import { debugLog } from '@/lib/utils/debugLogger';

// Start timing
const startTime = performance.now();

// ... your operation ...

// Log performance
const duration = performance.now() - startTime;
debugLog.info('Operation completed', 'MyService', { duration: `${duration.toFixed(2)}ms` });
```

## Best Practices

1. **Use Appropriate Log Levels**
   - `debug`: Detailed diagnostic info (development only)
   - `info`: General application flow
   - `warn`: Potentially problematic situations
   - `error`: Error events

2. **Include Context**
   - Always provide a context string (component/service name)
   - Include relevant data for debugging

3. **Mask Sensitive Data**
   - The logger automatically masks PII
   - Don't log passwords, tokens, or encryption keys

4. **Don't Over-log**
   - Only log meaningful events
   - Avoid logging in tight loops

5. **Use Structured Data**
   - Pass objects/arrays for complex data
   - Makes logs easier to read and filter

## Disabling Debug Logging

### In Production

Debug logging is automatically disabled in production unless explicitly enabled:

```env
# Production - debug disabled by default
NODE_ENV=production
```

### Manually Disable

```javascript
// In browser console
window.__DEBUG__ = false;
window.__DEBUG_PANEL__ = false;
location.reload();
```

## Troubleshooting

### Panel Not Showing

1. Check `NEXT_PUBLIC_DEBUG_PANEL=true` in `.env.local`
2. Verify panel wasn't closed (check if it exists in DOM)
3. Try keyboard shortcut: `Ctrl+Shift+D` or `Cmd+Shift+D`
4. Check browser console for errors

### Logs Not Appearing

1. Verify `NEXT_PUBLIC_DEBUG=true` in `.env.local`
2. Check browser console filters
3. Ensure log level is appropriate
4. Check if logs are being filtered out

### Performance Issues

1. Limit log entries (default: 100 max)
2. Disable debug panel if not needed
3. Use appropriate log levels
4. Don't log in performance-critical paths

## Integration with Existing Logger

The debug logger integrates with the existing secure logger (`lib/utils/logger.ts`):

- All debug logs also go through the secure logger
- PII masking is applied automatically
- Log levels are respected
- Console output is consistent

## Examples

### Authentication Flow

```typescript
import { debugLog } from '@/lib/utils/debugLogger';

// In AuthContext
debugLog.info('Auth state changed', 'AuthContext', {
  isAuthenticated: !!user,
  userId: user?.uid,
});

// In login component
debugLog.debug('Login attempt', 'LoginPage', {
  method: 'email',
  email: 'user@example.com', // Will be masked
});
```

### API Calls

```typescript
import { debugLog } from '@/lib/utils/debugLogger';

async function fetchData() {
  debugLog.debug('API request started', 'DataService', { endpoint: '/api/data' });
  
  try {
    const response = await fetch('/api/data');
    debugLog.info('API request completed', 'DataService', {
      status: response.status,
      duration: `${duration}ms`,
    });
  } catch (error) {
    debugLog.error('API request failed', 'DataService', { error });
  }
}
```

### Component Lifecycle

```typescript
import { useDebugInfo } from '@/components/debug/DebugPanel';

export function MyComponent({ userId, data }: Props) {
  useDebugInfo('MyComponent', { userId, dataCount: data?.length });
  
  // Component code...
}
```

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Check that debug logging is enabled
4. Review this guide for common issues

---

**Last Updated**: January 17, 2026
