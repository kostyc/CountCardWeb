# App Check Setup Status

**Date**: January 17, 2026  
**Project**: CountCard Web Application  
**Project ID**: `countcard-94c5b`

## ✅ Completed

1. **APIs Enabled**
   - ✅ reCAPTCHA Enterprise API enabled
   - ✅ Firebase App Check API enabled

2. **Code Integration**
   - ✅ App Check initialization added to `lib/firebase/config.ts`
   - ✅ Environment variable documentation updated
   - ✅ Setup script created: `scripts/setup-app-check.sh`
   - ✅ Setup guide created: `scripts/APP-CHECK-SETUP-GUIDE.md`

## ⏳ Remaining Steps

### Step 1: Create reCAPTCHA Enterprise Key

```bash
cd /Users/daddymac/Documents/App\ Development/CountCard/CountCardWeb
gcloud recaptcha keys create \
  --display-name="CountCard Web App Check" \
  --web \
  --allow-all-domains \
  --project=countcard-94c5b
```

**Note**: Save the key ID and site key from the output.

### Step 2: Get Firebase App ID

Your App ID is in `.env.local` as `NEXT_PUBLIC_FIREBASE_APP_ID`, or find it in:
- Firebase Console → Project Settings → Your apps → Web app

### Step 3: Register App Check App

```bash
# Replace YOUR_APP_ID and YOUR_KEY_ID with actual values
APP_ID="your-app-id-from-env-local"
KEY_ID="your-recaptcha-key-id"

gcloud firebase appcheck apps create $APP_ID \
  --platform="WEB" \
  --recaptcha-enterprise-key="projects/countcard-94c5b/keys/$KEY_ID" \
  --project=countcard-94c5b
```

### Step 4: Get reCAPTCHA Site Key

```bash
gcloud recaptcha keys describe $KEY_ID \
  --project=countcard-94c5b \
  --format="value(webKeySettings.siteKey)"
```

### Step 5: Create Debug Token (Development)

```bash
gcloud firebase appcheck debug-tokens create \
  --app=$APP_ID \
  --project=countcard-94c5b
```

### Step 6: Update `.env.local`

Add these variables to `.env.local`:

```env
# App Check Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key-from-step-4
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-debug-token-from-step-5
```

### Step 7: Verify Setup

1. Restart your dev server: `npm run dev`
2. Check browser console for App Check initialization messages
3. Verify no errors related to App Check

## Monitoring Phase (Before Enforcement)

1. **Enable App Check in Firebase Console** (but NOT enforcement yet)
   - Go to Firebase Console → App Check
   - Verify your app is registered
   - Monitor metrics for 1-2 weeks

2. **Monitor Metrics**:
   - Valid tokens generated
   - Invalid tokens
   - Token generation errors

3. **Verify Legitimate Users**:
   - Ensure all legitimate users can generate valid tokens
   - Check for any patterns in invalid tokens

## Enforcement Phase (After Monitoring)

Once you've confirmed App Check is working correctly:

1. **Enable Enforcement Gradually**:
   - Start with non-critical services (if any)
   - Then enable for Firestore
   - Monitor closely for 24-48 hours

2. **Enable via Firebase Console**:
   - Firebase Console → App Check → Your App
   - Toggle enforcement ON for each service

3. **Or via gcloud**:
   ```bash
   gcloud firebase appcheck services update firestore \
     --enforcement-mode=ENFORCED \
     --project=countcard-94c5b
   ```

## Quick Reference

- **Setup Script**: `./scripts/setup-app-check.sh`
- **Setup Guide**: `scripts/APP-CHECK-SETUP-GUIDE.md`
- **Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **reCAPTCHA Console**: https://console.cloud.google.com/security/recaptcha?project=countcard-94c5b

## Notes

- **Debug Tokens**: Only use in development. Never commit to production.
- **Domain Restrictions**: Consider restricting reCAPTCHA key to specific domains in production.
- **Costs**: reCAPTCHA Enterprise has usage-based pricing. Monitor usage.
- **Quotas**: High-traffic apps may need quota increases.

---

**Status**: APIs enabled, code integrated, ready for key creation and app registration
