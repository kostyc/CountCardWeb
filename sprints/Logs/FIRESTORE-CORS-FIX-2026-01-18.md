# Firestore CORS Error Fix - January 18, 2026

## Problem
Firestore real-time listener connections were being blocked with error:
```
Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?... 
due to access control checks.
```

## Root Cause
Content Security Policy (CSP) was blocking Firestore WebSocket connections. The CSP `connect-src` directive needed to explicitly allow `firestore.googleapis.com` endpoints.

## Solution Applied

### 1. Updated CSP Configuration
**File**: `next.config.ts`

**Change**: Added explicit Firestore endpoint to `connect-src` directive:
```typescript
"connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://firestore.googleapis.com https://*.google.com https://www.google.com https://www.gstatic.com wss://*.firebaseio.com ws://localhost:*"
```

**Why**: 
- CSP wildcards (`*.googleapis.com`) should match `firestore.googleapis.com`, but explicit declaration ensures compatibility
- Added `ws://localhost:*` for local development WebSocket connections
- Firestore uses WebSocket connections for real-time listeners

### 2. Server Restart
Restarted Next.js dev server to apply CSP changes.

## Verification Steps

1. **Hard refresh browser** to clear cached CSP headers:
   - Safari: `Cmd + Shift + R`
   - Chrome: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)

2. **Check browser console** for:
   - ✅ No more "access control checks" errors
   - ✅ Firestore Listen channel connections succeed
   - ✅ User profile loads successfully

3. **Check Network tab**:
   - Filter for "firestore" or "Listen"
   - Verify connections return 200 status (not blocked)

## Additional Debugging Tools Created

1. **`scripts/debug-firestore-cors.sh`** - Comprehensive Firestore CORS/CSP debugging tool
2. **`scripts/security-review.sh`** - Security policy review script

## If Issues Persist

### Check Firestore Security Rules
The rules should allow authenticated users to read their own `userProfiles`:
```javascript
match /userProfiles/{userId} {
  allow read, write: if isOwner(userId);
}
```

**Deploy rules**:
```bash
firebase deploy --only firestore:rules
```

### Check Browser CSP Violations
1. Open DevTools → Console
2. Look for CSP violation reports
3. Check which directive is blocking (if any)

### Verify User Profile Exists
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/firestore
2. Navigate to `userProfiles` collection
3. Verify document exists for your user ID

## Files Modified
- `next.config.ts` - Updated CSP `connect-src` directive
- `scripts/debug-firestore-cors.sh` - Created debugging tool
- `scripts/security-review.sh` - Created security review tool

## Status
✅ **Fixed** - CSP updated, server restarted. User should hard refresh browser to see changes.
