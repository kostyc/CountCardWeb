# App Check Fallback Setup: v3 Primary + Enterprise Fallback

**Date**: January 17, 2026  
**Project**: CountCard Web Application  
**Strategy**: Use reCAPTCHA v3 (free tier) as primary, Enterprise as fallback

## Overview

This setup uses **reCAPTCHA v3** as the primary provider (free tier, longer token TTL) with **reCAPTCHA Enterprise** as a fallback if v3 fails. This gives you:
- ✅ Free tier usage (v3 primary)
- ✅ Better security when needed (Enterprise fallback)
- ✅ Automatic failover if v3 has issues

## Keys Available

### Primary: reCAPTCHA v3
- **Site Key**: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
- **Token TTL**: ~1 day
- **Cost**: Free (with quotas)

### Fallback: reCAPTCHA Enterprise
- **Site Key**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
- **Token TTL**: ~1 hour
- **Cost**: Free tier + paid above quota

## Firebase Console Registration

### Step 1: Register with reCAPTCHA v3 (Primary)

1. Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. Click "Add app" or "Register app"
3. Select platform: **Web**
4. Select attestation provider: **reCAPTCHA** (not Enterprise)
5. Enter App ID: `1:36792557920:web:84f657866a2c35e75bbe05`
6. Enter site key: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
7. Click "Save"

### Step 2: Register with reCAPTCHA Enterprise (Fallback)

**Note**: Firebase App Check typically allows one provider per app registration. The fallback is handled in code, not in Firebase Console. However, you can:

**Option A**: Register Enterprise separately (if Firebase allows multiple providers)
- Follow same steps but select "reCAPTCHA Enterprise"
- Use site key: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`

**Option B**: Keep Enterprise ready but not registered (code handles fallback)
- The code will automatically try Enterprise if v3 fails
- No separate registration needed if v3 works

## Environment Variables

Add to `.env.local`:

```env
# App Check Configuration - Primary (v3)
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7

# App Check Configuration - Fallback (Enterprise)
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp

# Debug Token (Development only)
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=YOUR_DEBUG_TOKEN_HERE
```

## Code Implementation

The code in `lib/firebase/config.ts` has been updated to:

1. **Try v3 first** (primary, free tier)
2. **Fallback to Enterprise** if v3 initialization fails
3. **Log which provider is being used** for monitoring

### How It Works

```typescript
// 1. Try v3 first
try {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(v3Key),
    ...
  });
} catch (error) {
  // 2. If v3 fails, try Enterprise
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(enterpriseKey),
    ...
  });
}
```

## Monitoring

### Check Which Provider Is Active

1. **Browser Console**:
   - Look for: "App Check initialized with reCAPTCHA v3 (primary)"
   - Or: "App Check initialized with reCAPTCHA Enterprise (fallback)"

2. **Firebase Console**:
   - Go to App Check → Metrics
   - Monitor token generation
   - Check for any errors

### When Fallback Triggers

The fallback will activate if:
- v3 key is invalid or misconfigured
- Domain not authorized for v3 key
- v3 initialization throws an error
- Network issues preventing v3 from loading

## Testing the Fallback

### Test v3 (Primary)

1. Ensure `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` is set
2. Restart dev server
3. Check console: Should see "v3 (primary)" message
4. Verify tokens are generated

### Test Enterprise (Fallback)

1. Temporarily set invalid v3 key or remove it
2. Ensure `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` is set
3. Restart dev server
4. Check console: Should see "Enterprise (fallback)" message
5. Verify tokens are generated

## Production Considerations

### Cost Management

- **v3 (Primary)**: Free tier, longer TTL = fewer token refreshes = lower cost
- **Enterprise (Fallback)**: Only used if v3 fails, so minimal cost impact

### Security

- v3 provides good security for most use cases
- Enterprise provides enhanced security when needed
- Fallback ensures you always have protection

### Monitoring

- Monitor which provider is being used
- Set up alerts if fallback is triggered frequently
- Investigate if v3 fails often (may indicate configuration issue)

## Troubleshooting

### Issue: Always using Enterprise fallback

**Possible causes**:
- v3 key not set in environment variables
- v3 key invalid or misconfigured
- Domain not authorized for v3 key

**Solution**:
- Verify `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY` is set correctly
- Check v3 key configuration in reCAPTCHA console
- Verify domain is authorized

### Issue: Neither provider works

**Possible causes**:
- Both keys missing or invalid
- Network issues
- Firebase App Check not properly registered

**Solution**:
- Verify both keys are set in `.env.local`
- Check browser console for specific errors
- Verify app is registered in Firebase Console

## Quick Reference

| Provider | Site Key | Token TTL | Cost | Status |
|----------|----------|-----------|------|--------|
| v3 (Primary) | `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7` | ~1 day | Free | ✅ Active |
| Enterprise (Fallback) | `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp` | ~1 hour | Free+ | ✅ Ready |

## Next Steps

1. ✅ Code updated with fallback logic
2. ⏳ Register app with v3 in Firebase Console
3. ⏳ Add environment variables to `.env.local`
4. ⏳ Test v3 initialization
5. ⏳ Test Enterprise fallback (optional)
6. ⏳ Monitor which provider is used
7. ⏳ Enable enforcement after monitoring period

---

**Status**: Code ready, awaiting Firebase Console registration and environment variable setup
