# Debug Logging - Quick Start

## Enable Debug Logging

Add to `.env.local`:

```env
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_DEBUG_PANEL=true
```

## View Logs

### Option 1: Browser Console
1. Open DevTools: `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. Go to Console tab
3. All logs appear here

### Option 2: Visual Debug Panel
1. Press `Ctrl+Shift+D` (Windows) or `Cmd+Shift+D` (Mac)
2. Or run in console: `window.debugLog.togglePanel()`
3. Panel appears in bottom-right corner

## Use in Code

```typescript
import { debugLog } from '@/lib/utils/debugLogger';

// Log info
debugLog.info('User logged in', 'AuthContext', { userId: '123' });

// Log error
debugLog.error('API failed', 'DataService', { error: err });

// Log debug
debugLog.debug('Component mounted', 'MyComponent');
```

## Console Commands

```javascript
// Toggle panel
window.debugLog.togglePanel();

// Clear logs
window.debugLog.clear();

// Export logs
window.debugLog.export();
```

## Features

- ✅ Works in Chrome, Safari, Edge
- ✅ Visual debug panel
- ✅ Keyboard shortcut: `Ctrl+Shift+D` / `Cmd+Shift+D`
- ✅ Log filtering by level
- ✅ Auto PII masking
- ✅ Export logs as JSON

See [DEBUG-LOGGING-GUIDE.md](./DEBUG-LOGGING-GUIDE.md) for full documentation.
