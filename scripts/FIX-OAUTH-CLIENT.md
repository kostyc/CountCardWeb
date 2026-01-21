# Fix OAuth 2.0 Client ID Configuration

## Current Configuration Issues

Based on your OAuth Client ID settings, you need to add your development and production domains.

## Step-by-Step Fix

### Step 1: Add Authorized JavaScript Origins

**Location**: OAuth 2.0 Client ID → Authorized JavaScript Origins

**Current Origins**:
- ✅ `http://localhost`
- ✅ `http://localhost:5000`
- ✅ `https://countcard-94c5b.firebaseapp.com`

**Add These Origins**:
1. Click **"+ Add URI"** button
2. Add: `http://localhost:3000` (if your Next.js dev server runs on port 3000)
3. Click **"+ Add URI"** again
4. Add: `https://countcard.warriorwaypoint.com` (your production domain)
5. Click **"Save"** at the bottom of the page

**Why**: Your Next.js app likely runs on port 3000 in development, and you need your production domain for OAuth to work in production.

---

### Step 2: Add Authorized Redirect URIs (If Needed)

**Location**: OAuth 2.0 Client ID → Authorized Redirect URIs

**Current Redirect URI**:
- ✅ `https://countcard-94c5b.firebaseapp.com/_/auth/handler`

**Usually No Changes Needed**: Firebase automatically handles redirect URIs for Firebase Authentication. The current redirect URI should work for all domains.

**However, if you're using custom OAuth flows**, you might need to add:
- `http://localhost:3000` (for development)
- `https://countcard.warriorwaypoint.com` (for production)

**When to Add**: Only add custom redirect URIs if you're implementing OAuth flows outside of Firebase Authentication's standard flow.

---

## Quick Fix Commands

If you prefer using gcloud CLI:

```bash
# Set project
gcloud config set project countcard-94c5b

# Get your OAuth Client ID (you'll need this)
# Find it in the Google Cloud Console or run:
gcloud alpha iap oauth-clients list --format="value(name)"

# Add JavaScript origin for localhost:3000
gcloud alpha iap oauth-clients update YOUR_CLIENT_ID \
  --add-authorized-javascript-origins=http://localhost:3000

# Add JavaScript origin for production domain
gcloud alpha iap oauth-clients update YOUR_CLIENT_ID \
  --add-authorized-javascript-origins=https://countcard.warriorwaypoint.com
```

**Note**: The gcloud commands above may require the alpha version. It's easier to use the web console.

---

## What Each Section Does

### Authorized JavaScript Origins
- **Purpose**: Lists domains from which your web app can make OAuth requests
- **Required For**: Google Sign-In, Firebase Authentication with Google provider
- **Format**: Must include protocol (`http://` or `https://`) and domain
- **Example**: `http://localhost:3000`, `https://countcard.warriorwaypoint.com`

### Authorized Redirect URIs
- **Purpose**: Lists URLs where OAuth server can redirect users after authentication
- **Required For**: OAuth callback handling
- **Format**: Full URL including path
- **Example**: `https://countcard.warriorwaypoint.com/callback`

---

## Verification Checklist

After making changes:

- [ ] `http://localhost:3000` is in Authorized JavaScript Origins
- [ ] `https://countcard.warriorwaypoint.com` is in Authorized JavaScript Origins
- [ ] Changes are saved (click "Save" button)
- [ ] Test Google Sign-In in your app
- [ ] Test Google Sign-In on production domain

---

## Common Issues

### Issue: "Error 400: redirect_uri_mismatch"
**Cause**: The redirect URI used doesn't match what's configured
**Solution**: Add the exact redirect URI to the Authorized Redirect URIs list

### Issue: "Error 400: origin_mismatch"
**Cause**: The JavaScript origin doesn't match what's configured
**Solution**: Add your domain to Authorized JavaScript Origins

### Issue: OAuth works on localhost but not production
**Cause**: Production domain not in Authorized JavaScript Origins
**Solution**: Add `https://countcard.warriorwaypoint.com` to the list

---

## Next Steps

1. **Add the missing JavaScript origins** (see Step 1 above)
2. **Save the changes**
3. **Wait 1-2 minutes** for changes to propagate
4. **Test authentication** in your app
5. **Check browser console** for any OAuth errors

---

## Still Having Issues?

If authentication still doesn't work after adding the origins:

1. **Clear browser cache** and try again
2. **Check browser console** for specific error messages
3. **Verify Firebase Authentication providers** are enabled
4. **Check authorized domains** in Firebase Console (separate from OAuth origins)
