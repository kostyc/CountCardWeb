# App Check Configuration Values

**Date**: January 17, 2026  
**Project**: CountCard Web Application

## ✅ Created Resources

### reCAPTCHA Enterprise Key
- **Key ID**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
- **Site Key**: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp` (same as Key ID for Enterprise)
- **Display Name**: CountCard Web App Check
- **Full Resource Name**: `projects/36792557920/keys/6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`
- **Integration Type**: CHECKBOX
- **Allow All Domains**: true
- **Challenge Security Preference**: BALANCE
- **Created**: 2026-01-17T17:58:26Z

### Firebase App ID
- **App ID**: `1:36792557920:web:84f657866a2c35e75bbe05`

## 📝 Environment Variables to Add

Add these to your `.env.local` file:

```env
# App Check Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=YOUR_DEBUG_TOKEN_HERE
```

**Note**: The debug token will be created in the next step.

## 🔧 Manual Registration Required

App Check app registration must be done via Firebase Console (CLI not available):

### Steps:

1. **Go to Firebase Console**:
   https://console.firebase.google.com/project/countcard-94c5b/appcheck

2. **Register Your App**:
   - Click "Get started" or "Add app" if App Check is not set up
   - Select platform: **Web**
   - Select attestation provider: **reCAPTCHA Enterprise**
   - Enter your App ID: `1:36792557920:web:84f657866a2c35e75bbe05`
   - Select the reCAPTCHA key: `CountCard Web App Check` (or enter key ID: `6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`)
   - Click "Save" or "Register"

3. **Create Debug Token** (for development):
   - In Firebase Console → App Check → Your App
   - Go to "Debug tokens" section
   - Click "Add debug token"
   - Copy the generated token
   - Add it to `.env.local` as `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN`

## ✅ Verification

After registration and adding environment variables:

1. Restart your dev server: `npm run dev`
2. Check browser console for App Check initialization
3. Verify no errors related to App Check
4. Check Firebase Console → App Check → Metrics to see token generation

## 📚 Related Documentation

- Setup Guide: `scripts/APP-CHECK-SETUP-GUIDE.md`
- Status: `sprints/APP-CHECK-STATUS.md`

---

**Status**: reCAPTCHA key created, ready for manual registration in Firebase Console
