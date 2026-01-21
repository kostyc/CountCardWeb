# Environment Variables Setup Guide

## Overview

This guide will help you set up the `.env.local` file with all required Firebase configuration values. The `.env.local` file is required for the application to run and connect to Firebase.

## Current Status

❌ **`.env.local` file is missing** - This is causing the application to fail on startup.

## Quick Start

1. Copy the template file:
   ```bash
   cp .env.local.template .env.local
   ```

2. Follow the steps below to get Firebase configuration values
3. Fill in the values in `.env.local`
4. Restart the development server

---

## Step-by-Step Setup

### Step 1: Get Firebase Client SDK Configuration

These values are found in the Firebase Console.

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: `countcard-94c5b`
3. **Navigate to**: Project Settings (gear icon) > General tab
4. **Scroll to**: "Your apps" section
5. **If no web app exists**, click "Add app" > Web (</>) icon
6. **Copy the config values** from the Firebase SDK snippet:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",                    // → NEXT_PUBLIC_FIREBASE_API_KEY
     authDomain: "countcard-94c5b.firebaseapp.com",  // → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     projectId: "countcard-94c5b",         // → NEXT_PUBLIC_FIREBASE_PROJECT_ID
     storageBucket: "countcard-94c5b.appspot.com",   // → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "123456789",       // → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:123456789:web:abc123"       // → NEXT_PUBLIC_FIREBASE_APP_ID
   };
   ```

### Step 2: Get Firebase Admin SDK Configuration

These values come from a service account JSON file.

1. **In Firebase Console**: Project Settings > Service Accounts tab
2. **Click**: "Generate new private key"
3. **Download**: The JSON file (e.g., `countcard-94c5b-firebase-adminsdk-xxxxx.json`)
4. **Extract values** from the JSON file:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` characters)

   **Important**: The private key must be on a single line with `\n` characters preserved:
   ```
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
   ```

### Step 3: Configure Application Variables

#### ADMIN_USER_IDS
- Comma-separated list of Firebase user UIDs that should have admin privileges
- Leave empty for now if you don't have any admin users yet
- Example: `ADMIN_USER_IDS=user123,user456`

#### ALLOWED_ORIGINS
- Comma-separated list of allowed origins for CORS
- Default includes `http://localhost:3000` for development
- For production, add your production domain
- Example: `ALLOWED_ORIGINS=http://localhost:3000,https://countcard.warriorwaypoint.com`

#### ENCRYPTION_MASTER_KEY
- Master encryption key used to encrypt user encryption keys before storage in Firestore
- Must be a 32-byte key encoded as base64
- Generate a secure key using: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **Critical**: Keep this key secure and never commit it to version control
- Example: `ENCRYPTION_MASTER_KEY=AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnop==`

### Step 4: Configure App Check (Optional but Recommended)

#### NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY (Primary - Free Tier)
- reCAPTCHA v3 site key for App Check attestation (primary provider)
- Free tier, longer token TTL (~1 day)
- Example: `NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7`

#### NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY (Fallback)
- reCAPTCHA Enterprise site key for App Check attestation (fallback provider)
- Used if v3 fails, provides enhanced security
- Example: `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp`

**Note**: The code will try v3 first, then fallback to Enterprise if v3 fails. See `sprints/APP-CHECK-FALLBACK-SETUP.md` for details.

#### NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN (Development Only)
- Debug token for local development (bypasses App Check verification)
- Create with: `gcloud firebase appcheck debug-tokens create --app=YOUR_APP_ID`
- **⚠️ CRITICAL**: Never use in production builds - only for development
- Example: `NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=debug-token-1234567890abcdef`

**Note**: App Check setup is optional but highly recommended for production. See `scripts/APP-CHECK-SETUP-GUIDE.md` for complete setup instructions.

---

## Complete `.env.local` Example

```bash
# Firebase Client SDK Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=countcard-94c5b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=countcard-94c5b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=countcard-94c5b.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Firebase Admin SDK Configuration
FIREBASE_ADMIN_PROJECT_ID=countcard-94c5b
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@countcard-94c5b.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Application Configuration
ADMIN_USER_IDS=
ALLOWED_ORIGINS=http://localhost:3000,https://countcard.warriorwaypoint.com

# Encryption Configuration
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
ENCRYPTION_MASTER_KEY=YOUR_32_BYTE_BASE64_ENCODED_KEY_HERE

# App Check Configuration (Optional but Recommended)
# Primary: reCAPTCHA v3 (free tier, longer TTL)
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6Let700sAAAAAF2B-VcvaN5_KyQqLu0fRn9JdmY7
# Fallback: reCAPTCHA Enterprise (enhanced security)
NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp
# Debug token for development only (create with gcloud firebase appcheck debug-tokens create)
# ⚠️ NEVER use debug token in production builds
NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN=YOUR_DEBUG_TOKEN_HERE
```

---

## Verification Steps

After creating `.env.local`:

1. **Restart the dev server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Check for errors**:
   - The application should start without environment variable errors
   - Check browser console for any Firebase initialization errors
   - Verify the home page loads successfully

3. **Test Firebase connection**:
   - The app should no longer show "Missing required environment variables" error
   - Firebase should initialize successfully (you may still see other errors if Firestore database isn't created yet)

---

## Troubleshooting

### Error: "Missing required environment variables"
- **Cause**: `.env.local` file doesn't exist or is missing values
- **Solution**: Ensure `.env.local` exists and all required variables are set

### Error: "Firebase: Error (auth/invalid-api-key)"
- **Cause**: Invalid or missing `NEXT_PUBLIC_FIREBASE_API_KEY`
- **Solution**: Verify the API key from Firebase Console matches exactly

### Error: "Firebase Admin authentication failed"
- **Cause**: Invalid service account credentials
- **Solution**: 
  - Regenerate the private key in Firebase Console
  - Ensure the private key includes `\n` characters and is properly quoted

### Environment variables not loading
- **Cause**: Next.js may cache environment variables
- **Solution**: 
  - Restart the dev server completely
  - Clear Next.js cache: `rm -rf .next`
  - Restart: `npm run dev`

### Private key formatting issues
- **Cause**: Private key not properly formatted with `\n` characters
- **Solution**: 
  - The private key must be on a single line
  - Use `\n` to represent newlines
  - Keep the quotes around the entire key value

---

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Never share your Firebase credentials publicly
- The service account private key provides full admin access - keep it secure
- Rotate credentials if they're ever exposed

---

## Next Steps

After setting up `.env.local`:

1. ✅ Verify the application starts without errors
2. ✅ Test Firebase Client SDK connection (Test S1.4)
3. ✅ Test Firebase Admin SDK connection (Test S1.5)
4. ⏭️ Proceed with Sprint 2 development

---

## Related Documentation

- [Firebase Authentication Guide](./scripts/FIREBASE-AUTH-GUIDE.md)
- [Sprint 1 Documentation](./sprints/Sprint-1-2026-01-17/Sprint-1-2026-01-17.md)
- [Test Tracking](./sprints/TEST-TRACKING.md)
