# App Check Troubleshooting Guide

**Date**: January 17, 2026  
**Issue**: App Check 403 errors and authentication failures

## Current Issues

### Issue 1: App Check 403 Forbidden Error

**Error**: 
```
POST https://content-firebaseappcheck.googleapis.com/v1/projects/countcard-94c5b/apps/1:36792557920:web:84f657866a2c35e75bbe05:exchangeDebugToken?key=... 403 (Forbidden)
```

**Causes**:
1. App not registered in Firebase Console
2. Debug token not registered
3. App Check enforcement enabled before app is registered

**Solutions**:

#### Solution A: Register App in Firebase Console (Required)

1. Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. Click "Get started" or "Add app"
3. Select platform: **Web**
4. Select provider: **reCAPTCHA** (for v3) or **reCAPTCHA Enterprise**
5. Enter App ID: `1:36792557920:web:84f657866a2c35e75bbe05`
6. Enter site key:
   - For v3: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
   - For Enterprise: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
7. Click "Save"

#### Solution B: Register Debug Token

1. Open browser console when running app
2. Look for: "AppCheck debug token: ..."
3. Copy the token
4. Go to Firebase Console → App Check → Your App → Manage debug tokens
5. Click "Add debug token"
6. Paste the token
7. Click "Save"

#### Solution C: Temporarily Disable App Check (Development Only)

If App Check is blocking authentication and you need to test:

1. **Option 1**: Don't set reCAPTCHA keys in `.env.local` (App Check won't initialize)
2. **Option 2**: Comment out App Check initialization in code (not recommended)
3. **Option 3**: Register the app and debug token (recommended)

### Issue 2: Google Sign-In auth/internal-error

**Error**:
```
Firebase: Error (auth/internal-error)
```

**Possible Causes**:
1. App Check blocking the request (if enforcement enabled)
2. OAuth consent screen not configured
3. Authorized domains missing
4. OAuth client not configured

**Solutions**:

#### Solution A: Verify OAuth Consent Screen

1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
2. Verify consent screen is configured:
   - App name, support email, developer contact
   - User support email
   - Authorized domains include your domain
3. Save if needed

#### Solution B: Verify Authorized Domains

1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
2. Check "Authorized domains" includes:
   - `localhost`
   - `countcard.warriorwaypoint.com`
   - `countcard-94c5b.firebaseapp.com`
3. Add missing domains if needed

#### Solution C: Check App Check Enforcement

1. Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. **DO NOT enable enforcement yet** if app isn't registered
3. If enforcement is enabled, disable it temporarily:
   - Go to App Check → Your App → Services
   - Toggle enforcement OFF for all services
   - Register app and debug token first
   - Then enable enforcement gradually

#### Solution D: Verify Google Sign-In is Enabled

1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/providers
2. Verify "Google" provider is enabled
3. Check OAuth client configuration
4. Verify Web client ID is set

## Quick Fix Steps

### Immediate Fix (To Get Authentication Working)

1. **Register App Check app** in Firebase Console (see Solution A above)
2. **Register debug token** (see Solution B above)
3. **Verify OAuth consent screen** is configured
4. **Check authorized domains** include localhost
5. **Restart dev server**

### If Still Not Working

1. **Temporarily disable App Check**:
   - Remove or comment out reCAPTCHA keys from `.env.local`
   - Restart server
   - Test Google sign-in
   - If it works, the issue is App Check configuration

2. **Check browser console** for more specific errors

3. **Verify environment variables** are loaded:
   ```bash
   # Check if keys are set (won't show values, just confirms they exist)
   grep -q "NEXT_PUBLIC_RECAPTCHA" .env.local && echo "Keys found" || echo "Keys missing"
   ```

## Testing Checklist

- [ ] App registered in Firebase Console App Check
- [ ] Debug token registered (if using debug mode)
- [ ] OAuth consent screen configured
- [ ] Authorized domains include localhost
- [ ] Google Sign-In provider enabled
- [ ] Environment variables set in `.env.local`
- [ ] Server restarted after env changes
- [ ] Browser console checked for specific errors

## Environment Variables Check

Verify these are in `.env.local`:

```env
# For v3 primary + Enterprise fallback
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp

# Optional: Debug token (create in Firebase Console)
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-debug-token-here
```

## Next Steps

1. **Register App Check app** in Firebase Console (most important)
2. **Register debug token** from browser console
3. **Test Google sign-in** again
4. **Check browser console** for any remaining errors

---

**Status**: Code updated to handle App Check failures gracefully. Authentication should work even if App Check isn't configured yet.
