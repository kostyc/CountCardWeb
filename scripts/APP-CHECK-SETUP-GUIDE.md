# Firebase App Check Setup Guide

**Project**: CountCard Web Application  
**Project ID**: `countcard-94c5b`  
**Attestation Provider**: reCAPTCHA Enterprise (Web)

## Overview

Firebase App Check helps protect your backend resources from abuse by verifying that requests come from your genuine app. This guide covers setting up App Check via gcloud CLI and integrating it into the application.

## Prerequisites

- ✅ gcloud CLI installed and authenticated
- ✅ Firebase project `countcard-94c5b` accessible
- ✅ Firebase App ID available (from `.env.local` or Firebase Console)

## Quick Setup

Run the automated setup script:

```bash
cd /Users/daddymac/Documents/App\ Development/CountCard/CountCardWeb
./scripts/setup-app-check.sh
```

## Manual Setup Steps

### Step 1: Enable Required APIs

```bash
gcloud services enable recaptchaenterprise.googleapis.com --project=countcard-94c5b
gcloud services enable firebaseappcheck.googleapis.com --project=countcard-94c5b
```

### Step 2: Create reCAPTCHA Enterprise Key

```bash
gcloud recaptcha keys create \
  --display-name="CountCard Web App Check" \
  --web \
  --allow-all-domains \
  --project=countcard-94c5b
```

**Note**: The `--allow-all-domains` flag allows the key to work on any domain. For production, you may want to restrict this to specific domains.

### Step 3: Get Your Firebase App ID

Your App ID is in `.env.local` as `NEXT_PUBLIC_FIREBASE_APP_ID`, or you can find it in Firebase Console → Project Settings → Your apps.

### Step 4: Register App Check App

```bash
# Get your App ID first
APP_ID="your-app-id-here"

# Register the app with reCAPTCHA Enterprise
gcloud firebase appcheck apps update $APP_ID \
  --recaptcha-enterprise-key="projects/countcard-94c5b/keys/YOUR_KEY_ID" \
  --project=countcard-94c5b
```

If the app doesn't exist yet, use `create` instead:

```bash
gcloud firebase appcheck apps create $APP_ID \
  --platform="WEB" \
  --recaptcha-enterprise-key="projects/countcard-94c5b/keys/YOUR_KEY_ID" \
  --project=countcard-94c5b
```

### Step 5: Create Debug Token (Development)

For local development, create a debug token:

```bash
gcloud firebase appcheck debug-tokens create \
  --app="YOUR_APP_ID" \
  --project=countcard-94c5b
```

Add the debug token to `.env.local`:

```env
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-debug-token-here
```

**⚠️ Important**: Debug tokens should NEVER be used in production builds.

## Code Integration

### 1. Update Firebase Config

Add App Check initialization to `lib/firebase/config.ts`:

```typescript
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

// Initialize App Check (client-side only)
if (typeof window !== 'undefined') {
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!),
    isTokenAutoRefreshEnabled: true,
  });
}
```

### 2. Environment Variables

Add to `.env.local`:

```env
# App Check Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=your-debug-token  # Development only
```

### 3. Get reCAPTCHA Site Key

The site key is different from the key ID. Get it from:

```bash
gcloud recaptcha keys describe YOUR_KEY_ID \
  --project=countcard-94c5b \
  --format="value(webKeySettings.siteKey)"
```

Or find it in Google Cloud Console → reCAPTCHA Enterprise → Keys.

## Gradual Rollout Strategy

### Phase 1: Monitoring (Recommended First Step)

1. **Enable App Check** in Firebase Console but **DO NOT enable enforcement**
2. Monitor App Check metrics for 1-2 weeks:
   - Valid token count
   - Invalid token count
   - Token generation errors
3. Verify that legitimate users are generating valid tokens

### Phase 2: Soft Enforcement

1. Enable enforcement on **non-critical services first**:
   - Start with Cloud Functions (if used)
   - Then Storage (if used)
2. Monitor for any legitimate users being blocked
3. Adjust as needed

### Phase 3: Full Enforcement

1. Enable enforcement on **Firestore** (most critical)
2. Monitor closely for the first 24-48 hours
3. Have a rollback plan ready

## Enabling Enforcement

### Via Firebase Console

1. Go to Firebase Console → App Check
2. Select your app
3. For each service (Firestore, Storage, Functions), toggle enforcement ON
4. Monitor metrics after enabling

### Via gcloud (Firestore Example)

```bash
# Enable enforcement for Firestore
gcloud firebase appcheck services update firestore \
  --enforcement-mode=ENFORCED \
  --project=countcard-94c5b
```

## Monitoring App Check

### View Metrics in Firebase Console

1. Go to Firebase Console → App Check
2. Select your app
3. View metrics:
   - Valid tokens generated
   - Invalid tokens
   - Token errors
   - Enforcement denials

### View Metrics via gcloud

```bash
# List App Check apps
gcloud firebase appcheck apps list --project=countcard-94c5b

# Get app details
gcloud firebase appcheck apps describe YOUR_APP_ID --project=countcard-94c5b

# List debug tokens
gcloud firebase appcheck debug-tokens list --app=YOUR_APP_ID --project=countcard-94c5b
```

## Troubleshooting

### Issue: "App Check token generation failed"

**Solutions**:
- Verify reCAPTCHA site key is correct
- Check that reCAPTCHA Enterprise API is enabled
- Verify domain is allowed in reCAPTCHA key settings
- Check browser console for specific errors

### Issue: "Invalid App Check token" in production

**Solutions**:
- Ensure App Check is initialized in your code
- Verify enforcement is enabled for the service
- Check that tokens are being generated (monitor metrics)
- For development, ensure debug token is set correctly

### Issue: Legitimate users being blocked

**Solutions**:
- Temporarily disable enforcement
- Check App Check metrics for patterns
- Verify reCAPTCHA key allows your domains
- Review browser compatibility (reCAPTCHA requires modern browsers)

## Security Best Practices

1. **Never use debug tokens in production**
   - Debug tokens bypass App Check verification
   - Only use in development/staging environments

2. **Restrict reCAPTCHA key domains** (production)
   - Use `--allowed-domains` instead of `--allow-all-domains`
   - Specify only your production domains

3. **Monitor metrics regularly**
   - Set up alerts for unusual patterns
   - Review invalid token counts

4. **Combine with Security Rules**
   - App Check verifies app authenticity
   - Security Rules control data access
   - Use both together for defense in depth

5. **Version your App Check config**
   - Document when enforcement was enabled
   - Track changes to reCAPTCHA keys
   - Maintain rollback procedures

## Production Checklist

Before enabling enforcement in production:

- [ ] App Check initialized in code
- [ ] reCAPTCHA Enterprise key created and configured
- [ ] App registered with App Check
- [ ] Monitoring enabled for 1-2 weeks
- [ ] Valid token generation confirmed
- [ ] Debug tokens removed from production builds
- [ ] Domain restrictions configured (if applicable)
- [ ] Rollback plan documented
- [ ] Team trained on monitoring App Check metrics
- [ ] Alerts configured for anomalies

## Related Documentation

- [Firebase App Check Documentation](https://firebase.google.com/docs/app-check)
- [reCAPTCHA Enterprise Documentation](https://cloud.google.com/recaptcha-enterprise/docs)
- [App Check Best Practices](https://firebase.google.com/docs/app-check/cloud-functions)
- [Firebase Security Checklist](./FIREBASE-SETUP-CHECKLIST.md)

## Notes

- **Cost**: reCAPTCHA Enterprise has usage-based pricing. Monitor usage to avoid unexpected costs.
- **Quotas**: reCAPTCHA Enterprise has quotas. High-traffic apps may need to request quota increases.
- **Browser Support**: reCAPTCHA requires modern browsers. Ensure your target browsers are supported.
- **Performance**: App Check tokens are cached and auto-refreshed. Initial token generation may add slight latency.

---

**Last Updated**: January 17, 2026  
**Status**: Ready for implementation
