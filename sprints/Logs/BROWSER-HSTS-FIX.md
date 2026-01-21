# Fixing HSTS Issues in Safari and Chrome

## Problem
Safari and Chrome are forcing HTTPS connections to `localhost:3000` even though the Next.js dev server runs on HTTP. This causes TLS errors and prevents the app from loading.

## Root Cause
Browsers cache HSTS (HTTP Strict Transport Security) policies. If you've previously visited `https://localhost` or if HSTS was set for localhost, the browser will automatically redirect all HTTP requests to HTTPS.

## Solutions

### Chrome/Edge - Clear HSTS for localhost

1. **Open Chrome's HSTS settings:**
   - Navigate to: `chrome://net-internals/#hsts`
   - Or: `edge://net-internals/#hsts` for Edge

2. **Delete HSTS for localhost:**
   - Scroll down to "Delete domain security policies"
   - Enter: `localhost`
   - Click "Delete"
   - Also try: `127.0.0.1`

3. **Clear browser cache:**
   - Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
   - Select "Cached images and files"
   - Time range: "All time"
   - Click "Clear data"

4. **Restart Chrome completely** (close all windows)

5. **Access the app:**
   - Make sure you're using: `http://localhost:3000` (NOT `https://`)
   - Type it manually in the address bar to ensure it's HTTP

### Safari - Clear HSTS for localhost

1. **Clear Safari's HSTS cache:**
   - Open Safari
   - Go to Safari menu → Settings (or Preferences)
   - Click "Privacy" tab
   - Click "Manage Website Data..."
   - Search for "localhost"
   - Remove any localhost entries
   - Click "Remove Now"

2. **Clear Safari cache:**
   - Safari menu → Settings → Advanced
   - Check "Show Develop menu in menu bar"
   - Develop menu → Empty Caches
   - Or: Safari menu → Clear History → All History

3. **Reset Safari's HSTS (if needed):**
   - Close Safari completely
   - Open Terminal
   - Run: `defaults delete com.apple.Safari HSTS`
   - Restart Safari

4. **Access the app:**
   - Make sure you're using: `http://localhost:3000` (NOT `https://`)
   - Type it manually in the address bar

### Alternative: Use a different port or hostname

If clearing HSTS doesn't work, you can:

1. **Use 127.0.0.1 instead of localhost:**
   - Access: `http://127.0.0.1:3000`

2. **Use a different port:**
   - Modify `package.json` dev script to use a different port
   - Or use: `npm run dev -- -p 3001`
   - Access: `http://localhost:3001`

3. **Add a local hostname:**
   - Edit `/etc/hosts` (requires admin)
   - Add: `127.0.0.1 countcard.local`
   - Access: `http://countcard.local:3000`

### Verify the Fix

After clearing HSTS:

1. **Check the URL bar:**
   - Should show: `http://localhost:3000` (not `https://`)
   - No lock icon or security warnings

2. **Check browser console:**
   - Should see no TLS errors
   - Resources should load successfully

3. **If still having issues:**
   - Try incognito/private browsing mode
   - This bypasses most cached policies
   - Access: `http://localhost:3000` in private window

## Prevention

To avoid this issue in the future:

1. **Always use HTTP in development:**
   - Never access `https://localhost` during development
   - Bookmark `http://localhost:3000` to avoid typos

2. **Use different browsers for dev vs production:**
   - Use Cursor browser or Firefox for development
   - Keep Safari/Chrome for production testing only

3. **Consider using a local domain:**
   - Set up `countcard.local` in `/etc/hosts`
   - Less likely to have HSTS issues

## Notes

- The Next.js config is correct - it only forces HTTPS in production
- This is purely a browser-side caching issue
- Cursor browser works because it doesn't have the same HSTS cache
- The dev server is running correctly on HTTP
