# reCAPTCHA v3 Setup Guide

**Date**: January 17, 2026  
**Project**: CountCard Web Application  
**Purpose**: Create reCAPTCHA v3 key for Firebase App Check (standard option)

## Overview

If you need to use the standard "reCAPTCHA" option (not Enterprise) in Firebase App Check, you'll need to create a reCAPTCHA v3 key. This is different from the reCAPTCHA Enterprise key we already created.

## ⚠️ Important Note

**We already have reCAPTCHA Enterprise set up**, which is the recommended option for production. You only need reCAPTCHA v3 if:
- You specifically want to use the free tier
- You prefer the simpler setup
- You want longer token TTL (1 day vs 1 hour)

## Creating reCAPTCHA v3 Key

reCAPTCHA v3 keys are created in the **reCAPTCHA Admin Console**, not via gcloud.

### Step 1: Access reCAPTCHA Admin Console

1. Go to: https://www.google.com/recaptcha/admin
2. Sign in with your Google account (same account used for Firebase)
3. Click **"+ Create"** or **"Create"** button

### Step 2: Configure the Key

1. **Label**: Enter a name (e.g., "CountCard Web App Check v3")
2. **reCAPTCHA type**: Select **"reCAPTCHA v3"**
3. **Domains**: Add your domains:
   - `localhost` (for development)
   - `countcard.warriorwaypoint.com` (production)
   - `countcard-94c5b.firebaseapp.com` (Firebase default domain)
   - Or use `*` for all domains (less secure, but easier for development)
4. **Owners**: Your email should be listed
5. **Accept the reCAPTCHA Terms of Service**
6. Click **"Submit"**

### Step 3: Get Your Keys

After creation, you'll see:
- **Site Key**: This is what you use in Firebase App Check (starts with `6L...`)
- **Secret Key**: Keep this secure (starts with `6L...`)

**Example format**:
- Site Key: `6LcAbCdEfGhIjKlMnOpQrStUvWxYz1234567890`
- Secret Key: `6LcAbCdEfGhIjKlMnOpQrStUvWxYz1234567890` (different from site key)

### Step 4: Use in Firebase App Check

1. Go to Firebase Console → App Check
2. Select **"reCAPTCHA"** (not Enterprise)
3. Enter your **Site Key** from Step 3
4. Save

### Step 5: Update Environment Variables

Add to `.env.local`:

```env
# For reCAPTCHA v3 (standard)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_V3_SITE_KEY_HERE
```

**Note**: If you're using Enterprise, use the Enterprise key instead.

## Code Configuration

The code in `lib/firebase/config.ts` currently uses `ReCaptchaEnterpriseProvider`. If you want to use standard reCAPTCHA v3, you'll need to change it to `ReCaptchaV3Provider`.

### Current (Enterprise):
```typescript
provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey)
```

### For v3 (Standard):
```typescript
import { ReCaptchaV3Provider } from 'firebase/app-check';

provider: new ReCaptchaV3Provider(recaptchaSiteKey)
```

## Comparison: v3 vs Enterprise

| Feature | reCAPTCHA v3 | reCAPTCHA Enterprise |
|---------|--------------|----------------------|
| **Cost** | Free (with quotas) | Free tier + paid |
| **Token TTL** | ~1 day | ~1 hour |
| **Security** | Good | Better |
| **Risk Score Resolution** | Basic | Enhanced (0.1 increments) |
| **Support** | Community | Enterprise SLA |
| **Setup** | reCAPTCHA Admin Console | Google Cloud Console |

## Recommendation

Since we already have **reCAPTCHA Enterprise** set up and configured:
- ✅ **Use Enterprise** - Better security, already configured
- ⚠️ Only create v3 if you specifically need the free tier or longer token TTL

## Quick Reference

- **reCAPTCHA Admin Console**: https://www.google.com/recaptcha/admin
- **Firebase App Check Console**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **Current Enterprise Key**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`

---

**Status**: Instructions provided - create v3 key manually in reCAPTCHA Admin Console if needed
