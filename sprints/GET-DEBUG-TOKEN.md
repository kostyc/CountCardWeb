# How to Get and Register App Check Debug Token

## Step 1: Get Debug Token from Browser Console

Since you're running on `localhost`, the debug token is automatically generated in the browser console.

1. **Open your app** in the browser: http://localhost:3000
2. **Open browser console**:
   - Chrome/Edge: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Safari: Enable Developer menu, then `Cmd+Option+C`
3. **Look for this message** in the console:
   ```
   AppCheck debug token: "123a4567-b89c-12d3-e456-789012345678". 
   You will need to safelist it in the Firebase console for it to work.
   ```
4. **Copy the token** (the string in quotes)

## Step 2: Register Token in Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. **Click on your app** (or register it first if not done)
3. **Click "Manage debug tokens"** (overflow menu or button)
4. **Click "Add debug token"**
5. **Paste the token** you copied from the browser console
6. **Click "Save"** or "Add"
7. **Click "Done"**

## Alternative: Create Token Directly in Console

If you prefer to create the token in Firebase Console first:

1. **Go to Firebase Console** → App Check → Your App
2. **Click "Manage debug tokens"**
3. **Click "Add debug token"**
4. **Copy the generated token**
5. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-token-here
   ```
6. **Restart dev server**

## Troubleshooting

### If you don't see the debug token in console:

1. **Check that App Check is initializing**:
   - Look for: "App Check initialized with reCAPTCHA v3 (primary)"
   - Or: "App Check initialized with reCAPTCHA Enterprise (fallback)"

2. **Verify environment variables**:
   - `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` or `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` must be set
   - Check `.env.local` file

3. **Check browser console for errors**:
   - Look for any App Check related errors
   - The token message appears after successful initialization

### If token doesn't work after registering:

1. **Refresh the page** after registering the token
2. **Clear browser cache** and try again
3. **Verify token was copied correctly** (no extra spaces)
4. **Check that you're in development mode** (`NODE_ENV=development`)

## Quick Reference

- **Browser Console**: Look for "AppCheck debug token: ..."
- **Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **Token Format**: UUID-like string (e.g., `123a4567-b89c-12d3-e456-789012345678`)

---

**Next Step**: Check your browser console for the debug token message!
