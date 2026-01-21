# App Check Keys - Complete Reference

**Date**: January 17, 2026  
**Project**: CountCard Web Application

## Available Keys

### 1. reCAPTCHA Enterprise Key (Recommended for Production)
- **Key ID**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
- **Site Key**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
- **Display Name**: CountCard Web App Check
- **Integration Type**: CHECKBOX
- **Token TTL**: ~1 hour (default)
- **Use Case**: Production apps requiring stronger security
- **Created**: 2026-01-17T17:58:26Z

### 2. reCAPTCHA v3 Key (Score-based, Standard)
- **Key ID**: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
- **Site Key**: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
- **Display Name**: CountCard Web App Check v3
- **Integration Type**: SCORE (v3-style)
- **Token TTL**: ~1 day (default)
- **Use Case**: Standard apps, free tier, longer token lifetime
- **Created**: 2026-01-17T18:41:05Z

## Firebase App ID
- **App ID**: `1:36792557920:web:84f657866a2c35e75bbe05`

## Which Key to Use?

### Use reCAPTCHA Enterprise (`6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`) if:
- ✅ You want stronger security and fraud detection
- ✅ You need enterprise-grade support and SLA
- ✅ You're okay with shorter token TTL (1 hour)
- ✅ You can accept potential costs above free tier

### Use reCAPTCHA v3 (`6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`) if:
- ✅ You want longer token TTL (1 day)
- ✅ You prefer the free tier
- ✅ You want simpler setup
- ✅ Your security requirements are moderate

## Firebase App Check Configuration

### For reCAPTCHA Enterprise:
1. Go to Firebase Console → App Check
2. Select **"reCAPTCHA Enterprise"** as provider
3. Enter site key: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
4. Or select key: "CountCard Web App Check"

### For reCAPTCHA v3 (Standard):
1. Go to Firebase Console → App Check
2. Select **"reCAPTCHA"** (not Enterprise) as provider
3. Enter site key: `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`
4. Or select key: "CountCard Web App Check v3"

## Environment Variables

### For Enterprise (Current Setup):
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp
```

### For v3 (Standard):
```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7
```

## Code Configuration

The current code in `lib/firebase/config.ts` uses `ReCaptchaEnterpriseProvider`. 

### To use Enterprise (current):
```typescript
provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey)
```

### To use v3 (if switching):
```typescript
import { ReCaptchaV3Provider } from 'firebase/app-check';

provider: new ReCaptchaV3Provider(recaptchaSiteKey)
```

## Quick Reference

| Key Type | Site Key | Provider in Code | Token TTL |
|----------|----------|------------------|-----------|
| Enterprise | `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp` | `ReCaptchaEnterpriseProvider` | ~1 hour |
| v3 (Standard) | `6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7` | `ReCaptchaV3Provider` | ~1 day |

## Recommendation

**Use reCAPTCHA Enterprise** (`6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`) for production:
- Better security
- Already configured in code
- Recommended by Google for production apps

Use v3 only if you specifically need:
- Longer token TTL (1 day)
- Free tier only
- Simpler setup

---

**Status**: Both keys created and ready to use
