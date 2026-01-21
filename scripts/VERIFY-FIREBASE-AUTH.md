# Firebase Authentication Verification Guide

## Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b
- **Authentication Settings**: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
- **Sign-in Methods**: https://console.firebase.google.com/project/countcard-94c5b/authentication/providers
- **OAuth Consent Screen**: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
- **Google Cloud Console**: https://console.cloud.google.com/?project=countcard-94c5b

---

## Step-by-Step Verification Checklist

### ✅ Step 1: Verify Authentication is Enabled

**Location**: Firebase Console → Authentication

**Steps**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication
2. **Check**: You should see the Authentication dashboard (not a "Get started" button)
3. **If you see "Get started"**: Click it to enable Authentication

**Expected Result**: Authentication dashboard is visible with tabs for Users, Sign-in method, Templates, etc.

---

### ✅ Step 2: Verify Sign-in Methods (Providers)

**Location**: Firebase Console → Authentication → Sign-in method

**Steps**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/providers
2. Check each provider:

#### Email/Password
- **Status**: Should be **Enabled**
- **Click on "Email/Password"** to verify:
  - ✅ Enabled toggle is ON
  - ✅ Email link (passwordless sign-in) can be disabled (not needed)
  - ✅ Password policy settings (if available)

#### Phone
- **Status**: Should be **Enabled**
- **Click on "Phone"** to verify:
  - ✅ Enabled toggle is ON
  - ✅ Test phone numbers configured (optional, for testing)

#### Google
- **Status**: Should be **Enabled**
- **Click on "Google"** to verify:
  - ✅ Enabled toggle is ON
  - ✅ Project support email is set
  - ✅ OAuth consent screen is configured (see Step 3)

#### Apple
- **Status**: Should be **Enabled**
- **Click on "Apple"** to verify:
  - ✅ Enabled toggle is ON
  - ✅ Services ID configured
  - ✅ Apple Developer account linked

**Expected Result**: All four providers (Email/Password, Phone, Google, Apple) are enabled.

---

### ✅ Step 3: Verify Authorized Domains

**Location**: Firebase Console → Authentication → Settings → Authorized domains

**Steps**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
2. Scroll to **"Authorized domains"** section
3. Verify these domains are listed:
   - ✅ `localhost` (for local development)
   - ✅ `countcard.warriorwaypoint.com` (your custom domain)
   - ✅ `countcard-94c5b.firebaseapp.com` (default Firebase domain)
   - ✅ `countcard-94c5b.web.app` (default Firebase domain)

**To Add a Domain**:
1. Click **"Add domain"**
2. Enter the domain (e.g., `countcard.warriorwaypoint.com`)
3. Click **"Add"**

**Expected Result**: All required domains are listed in authorized domains.

---

### ✅ Step 4: Verify OAuth Consent Screen (For Google/Apple Sign-In)

**Location**: Google Cloud Console → APIs & Services → OAuth consent screen

**Steps**:
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
2. Check the following:

#### OAuth Consent Screen Configuration
- **User Type**: 
  - Internal (if using Google Workspace)
  - External (for public users) - **Most common**
- **App name**: Should be set (e.g., "CountCard")
- **User support email**: Your email address
- **App logo**: Optional but recommended
- **Application home page**: Your website URL
- **Authorized domains**: Should include:
  - `warriorwaypoint.com`
  - `countcard.warriorwaypoint.com`

#### Scopes
- **Scopes**: Should include at minimum:
  - `openid`
  - `email`
  - `profile`

#### Test Users (If in Testing Mode)
- If OAuth consent screen is in "Testing" mode, add test user emails
- Users not in the test list will see a warning

**Expected Result**: OAuth consent screen is configured with proper app name, support email, and authorized domains.

---

### ✅ Step 5: Verify Password Policy (If Configured)

**Location**: Firebase Console → Authentication → Settings → Password policy

**Steps**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
2. Scroll to **"Password policy"** section (if available)
3. Verify settings match requirements:
   - ✅ Minimum length: 12 characters
   - ✅ Maximum length: 4096 characters
   - ✅ Require uppercase: Enabled
   - ✅ Require lowercase: Enabled
   - ✅ Require numeric: Enabled
   - ✅ Require special characters: Enabled
   - ✅ Force upgrade on sign-in: Enabled

**Note**: Password policy enforcement may be handled in application code rather than Firebase Console settings.

---

### ✅ Step 6: Verify OAuth Credentials (Google Sign-In)

**Location**: Google Cloud Console → APIs & Services → Credentials

**Steps**:
1. Go to: https://console.cloud.google.com/apis/credentials?project=countcard-94c5b
2. Look for **"OAuth 2.0 Client IDs"**
3. Verify:
   - ✅ At least one OAuth 2.0 Client ID exists
   - ✅ Client ID type is "Web application"
   - ✅ Authorized JavaScript origins include:
     - `http://localhost:3000` (for development)
     - `https://countcard.warriorwaypoint.com` (for production)
   - ✅ Authorized redirect URIs include:
     - `http://localhost:3000` (for development)
     - `https://countcard.warriorwaypoint.com` (for production)
     - Firebase auth domain redirects (automatically added)

**Expected Result**: OAuth 2.0 Client ID is configured with proper origins and redirect URIs.

---

### ✅ Step 7: Verify Apple Sign-In Configuration

**Location**: Firebase Console → Authentication → Sign-in method → Apple

**Steps**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/providers
2. Click on **"Apple"**
3. Verify:
   - ✅ Enabled toggle is ON
   - ✅ Services ID is configured
   - ✅ Apple Developer account is linked
   - ✅ OAuth redirect URL is set correctly

**Note**: Apple Sign-In requires:
- Apple Developer account
- Services ID created in Apple Developer portal
- OAuth redirect URL configured in Apple Developer portal

---

### ✅ Step 8: Test Authentication Flow

**Manual Testing Steps**:

1. **Test Email/Password Sign-up**:
   - Go to your login page
   - Click "Sign up" or "Create account"
   - Enter email and password (must meet password policy)
   - Verify account is created successfully

2. **Test Email/Password Sign-in**:
   - Go to your login page
   - Enter email and password
   - Verify sign-in is successful

3. **Test Google Sign-in**:
   - Go to your login page
   - Click "Sign in with Google"
   - Verify OAuth consent screen appears
   - Complete sign-in flow
   - Verify user is authenticated

4. **Test Apple Sign-in**:
   - Go to your login page
   - Click "Sign in with Apple"
   - Verify Apple sign-in flow works
   - Verify user is authenticated

---

## Common Issues and Solutions

### Issue: "OAuth consent screen not configured"

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
2. Click "CONFIGURE CONSENT SCREEN"
3. Fill in required fields:
   - User Type (External recommended)
   - App name
   - User support email
   - Authorized domains
4. Add scopes: `openid`, `email`, `profile`
5. Save and continue

### Issue: "Domain not authorized"

**Solution**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
2. Scroll to "Authorized domains"
3. Click "Add domain"
4. Enter your domain (e.g., `countcard.warriorwaypoint.com`)
5. Click "Add"

### Issue: "OAuth redirect URI mismatch"

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials?project=countcard-94c5b
2. Find your OAuth 2.0 Client ID
3. Click to edit
4. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://countcard.warriorwaypoint.com` (production)
   - Firebase auth domain redirects (usually auto-added)

### Issue: "Authentication provider not enabled"

**Solution**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/providers
2. Click on the provider (Email/Password, Phone, Google, or Apple)
3. Toggle "Enable" to ON
4. Configure any required settings
5. Click "Save"

---

## Verification Commands

### Check Firebase Authentication Status (CLI)

```bash
# List authentication providers (requires Firebase CLI)
firebase auth:export users.json --project=countcard-94c5b --format=json

# Check if Firebase CLI is authenticated
firebase projects:list
```

### Check Google Cloud APIs

```bash
# Check Identity Toolkit API (Firebase Authentication)
gcloud services list --enabled --filter="name:identitytoolkit.googleapis.com" --project=countcard-94c5b

# List all enabled APIs
gcloud services list --enabled --project=countcard-94c5b
```

---

## Quick Checklist Summary

- [ ] Authentication is enabled in Firebase Console
- [ ] Email/Password provider is enabled
- [ ] Phone provider is enabled
- [ ] Google provider is enabled
- [ ] Apple provider is enabled
- [ ] Authorized domains include `localhost` and `countcard.warriorwaypoint.com`
- [ ] OAuth consent screen is configured
- [ ] OAuth 2.0 Client ID has correct redirect URIs
- [ ] Password policy matches requirements (if applicable)
- [ ] All required Google Cloud APIs are enabled

---

## Next Steps After Verification

1. **If everything is configured correctly**: Test authentication in your application
2. **If something is missing**: Follow the steps above to configure it
3. **If authentication still fails**: Check browser console for specific error messages
4. **If OAuth sign-in fails**: Verify OAuth consent screen and redirect URIs

---

## Support Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign-In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Firebase Console](https://console.firebase.google.com/project/countcard-94c5b)
