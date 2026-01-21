# App Check Next Steps - Quick Reference

## ✅ Completed via gcloud

1. ✅ APIs enabled (reCAPTCHA Enterprise, Firebase App Check)
2. ✅ reCAPTCHA Enterprise key created
3. ✅ Code integration complete
4. ✅ Documentation created

## 📋 Manual Steps Required

### Step 1: Register App in Firebase Console

**URL**: https://console.firebase.google.com/project/countcard-94c5b/appcheck

**Steps**:
1. Click "Get started" or navigate to App Check section
2. Click "Add app" or "Register app"
3. Select platform: **Web**
4. Select attestation provider: **reCAPTCHA Enterprise**
5. Enter App ID: `1:36792557920:web:84f657866a2c35e75bbe05`
6. Select reCAPTCHA key: `CountCard Web App Check` (or key ID: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`)
7. Click "Save" or "Register"

### Step 2: Create Debug Token

**In Firebase Console**:
1. Go to App Check → Your registered app
2. Scroll to "Debug tokens" section
3. Click "Add debug token"
4. Copy the generated token

### Step 3: Update .env.local

Add these lines to your `.env.local` file:

```env
# App Check Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=YOUR_DEBUG_TOKEN_FROM_STEP_2
```

**⚠️ Important**: 
- Debug token is for development only
- Never commit `.env.local` to version control
- Never use debug token in production builds

### Step 4: Verify Setup

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Check browser console**:
   - Open browser DevTools → Console
   - Look for App Check initialization messages
   - Should see: "App Check initialized" or similar
   - No errors related to App Check

3. **Check Firebase Console**:
   - Go to App Check → Metrics
   - Should see token generation activity
   - Valid tokens should be increasing

## 🎯 After Verification

### Monitoring Phase (1-2 weeks)

1. **DO NOT enable enforcement yet**
2. Monitor App Check metrics:
   - Valid tokens generated
   - Invalid tokens (should be minimal)
   - Token generation errors
3. Verify all legitimate users can generate tokens
4. Check for any patterns in invalid tokens

### Enforcement Phase (After Monitoring)

Once you've confirmed App Check is working:

1. **Enable enforcement gradually**:
   - Start with non-critical services (if any)
   - Then enable for Firestore
   - Monitor closely for 24-48 hours

2. **Enable via Firebase Console**:
   - App Check → Your App → Services
   - Toggle enforcement ON for each service
   - Start with "Monitor" mode if available, then "Enforce"

## 📊 Quick Commands

### View reCAPTCHA Key
```bash
gcloud recaptcha keys describe 6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp \
  --project=countcard-94c5b \
  --format="json"
```

### List App Check Apps (after registration)
```bash
# Note: This may require Firebase Console, not available via CLI
```

### View App Check Status
- Firebase Console: https://console.firebase.google.com/project/countcard-94c5b/appcheck

## 🔗 Quick Links

- **Firebase Console App Check**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **reCAPTCHA Console**: https://console.cloud.google.com/security/recaptcha?project=countcard-94c5b
- **Setup Guide**: `scripts/APP-CHECK-SETUP-GUIDE.md`
- **Configuration Values**: `sprints/APP-CHECK-VALUES.md`

---

**Current Status**: Ready for manual registration in Firebase Console
