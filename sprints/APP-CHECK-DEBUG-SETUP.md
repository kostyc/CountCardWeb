# App Check Debug Provider Setup

**Reference**: [Firebase App Check Debug Provider Documentation](https://firebase.google.com/docs/app-check/web/debug-provider)

## Overview

The debug provider allows your app to work in development environments (localhost, CI) where App Check would normally reject requests. **⚠️ CRITICAL**: Never use debug tokens in production builds.

## How It Works

The debug provider uses `self.FIREBASE_APPCHECK_DEBUG_TOKEN` which must be set **BEFORE** calling `initializeAppCheck()`.

### For Localhost Development

1. **Set debug token to `true`** (code already does this automatically in development):
   ```typescript
   (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
   ```

2. **Run your app** and check the browser console. You'll see:
   ```
   AppCheck debug token: "123a4567-b89c-12d3-e456-789012345678". 
   You will need to safelist it in the Firebase console for it to work.
   ```

3. **Register the token** in Firebase Console:
   - Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
   - Click on your app → **"Manage debug tokens"** (overflow menu)
   - Click **"Add debug token"**
   - Paste the token from the console
   - Click **"Save"**

### For CI/Other Environments

1. **Create a debug token** in Firebase Console:
   - Go to App Check → Your App → Manage debug tokens
   - Click "Add debug token"
   - Copy the generated token

2. **Add to environment variables**:
   ```env
   NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-debug-token-here
   ```

3. **Code automatically uses it** (already implemented):
   - If `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` is set, it will be used
   - Otherwise, it defaults to `true` for localhost development

## Current Implementation

The code in `lib/firebase/config.ts` automatically:

1. **Development mode**: Sets `FIREBASE_APPCHECK_DEBUG_TOKEN = true` (for localhost)
2. **If debug token env var exists**: Uses that specific token (for CI/other environments)
3. **Production**: Does not set debug token (normal App Check behavior)

## Security Warnings

⚠️ **CRITICAL**: 
- Debug tokens bypass App Check verification
- **Never** commit debug tokens to public repositories
- **Never** use debug tokens in production builds
- **Revoke** tokens immediately if compromised
- Debug tokens are stored locally in your browser

## Testing

### Test Localhost Debug Mode

1. Start dev server: `npm run dev`
2. Open browser console
3. Look for: "AppCheck debug token: ..."
4. Copy the token
5. Register in Firebase Console
6. Refresh the page
7. App Check should work on localhost

### Test CI Debug Mode

1. Set `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN` in CI environment
2. Create token in Firebase Console first
3. Deploy/run in CI
4. App Check should work with the registered token

## Troubleshooting

### Issue: "AppCheck debug token not registered"

**Solution**: 
- Copy the token from browser console
- Register it in Firebase Console → App Check → Manage debug tokens
- Refresh the page

### Issue: Debug token not showing in console

**Solution**:
- Ensure you're in development mode (`NODE_ENV=development`)
- Check that App Check initialization is running
- Verify reCAPTCHA keys are set

### Issue: Debug token works but production doesn't

**Solution**:
- This is expected! Debug tokens only work in development
- For production, ensure App Check is properly registered with real provider
- Verify production environment variables are set correctly

## Quick Reference

- **Documentation**: https://firebase.google.com/docs/app-check/web/debug-provider
- **Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **Code Location**: `lib/firebase/config.ts`

---

**Status**: Debug provider properly implemented according to Firebase documentation
