# Firebase Setup Checklist

## Overview
This checklist covers all Firebase configuration steps needed for the CountCard web application. Complete these steps in the Firebase Console to ensure all services are properly configured.

## Project Information
- **Firebase Project ID**: `countcard-94c5b`
- **Firebase Console**: https://console.firebase.google.com/project/countcard-94c5b
- **Custom Domain**: `countcard.warriorwaypoint.com`

---

## ✅ Completed Items

### Authentication
- ✅ Email/Password authentication enabled
- ✅ Phone authentication enabled
- ✅ Google Sign-In enabled
- ✅ Apple Sign-In enabled
- ✅ Password policy configured (12+ characters, mixed case, numbers, special characters)
- ✅ Custom domain added to authorized domains (`countcard.warriorwaypoint.com`)

### Configuration Files
- ✅ `firebase.json` configured
- ✅ `.firebaserc` configured with project ID
- ✅ `firestore.rules` created (restrictive rules - will be expanded in Sprint 14)
- ✅ `firestore.indexes.json` created with required indexes
- ✅ Environment variables configured in `.env.local`

---

## ⚠️ Required Manual Steps in Firebase Console

### 1. Create Firestore Database (If Not Already Created)

**Location**: Firebase Console → Firestore Database

**Steps**:
1. Go to https://console.firebase.google.com/project/countcard-94c5b/firestore
2. If you see "Create database" button, click it
3. Choose **Production mode** (we have security rules configured)
4. Select a **location** for your database (choose closest to your users)
   - Recommended: `us-central1` (Iowa) or `us-east1` (South Carolina)
5. Click **Enable**

**Note**: This is a one-time setup. Once created, the database is ready to use.

---

### 2. Deploy Firestore Security Rules

**Location**: Firebase Console → Firestore Database → Rules tab

**Steps**:
1. Open terminal in project directory
2. Ensure you're authenticated: `firebase login`
3. Deploy rules:
   ```bash
   cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
   firebase deploy --only firestore:rules
   ```
4. Verify in Firebase Console that rules are deployed
5. Check that rules match `firestore.rules` file (currently restrictive - denies all access)

**Current Rules Status**: 
- Rules are set to deny all access (security-first approach)
- Will be expanded in Sprint 14 with proper role-based access control
- This is intentional and safe for now

---

### 3. Deploy Firestore Indexes

**Location**: Firebase Console → Firestore Database → Indexes tab

**Steps**:
1. Open terminal in project directory
2. Ensure you're authenticated: `firebase login`
3. Deploy indexes:
   ```bash
   cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
   firebase deploy --only firestore:indexes
   ```
4. Verify in Firebase Console → Firestore → Indexes tab
5. Wait for indexes to build (may take a few minutes)
6. Check that all indexes from `firestore.indexes.json` are listed

**Indexes to Deploy**:
- Recruits collection indexes (battalion, company, platoon, status, etc.)
- Count Cards collection indexes (status, createdAt, organizational hierarchy)
- Additional indexes as defined in `firestore.indexes.json`

---

### 4. Verify Authentication Settings

**Location**: Firebase Console → Authentication → Settings

**Steps**:
1. Go to https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
2. Verify **Authorized domains** includes:
   - `localhost` (for development)
   - `countcard.warriorwaypoint.com` (production domain)
   - `countcard-94c5b.firebaseapp.com` (default Firebase domain)
3. Check **Sign-in method** tab:
   - ✅ Email/Password: Enabled
   - ✅ Phone: Enabled
   - ✅ Google: Enabled (with OAuth consent screen configured)
   - ✅ Apple: Enabled (with Apple Developer account configured)

---

### 5. Verify OAuth Consent Screen (Google Sign-In)

**Location**: Google Cloud Console → APIs & Services → OAuth consent screen

**Steps**:
1. Go to https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
2. Verify OAuth consent screen is configured:
   - App name: CountCard (or appropriate name)
   - User support email: Your email
   - Authorized domains: `warriorwaypoint.com`, `countcard.warriorwaypoint.com`
3. Add test users if in testing mode
4. Submit for verification if going to production

**Note**: For development, you can add test users. For production, OAuth consent screen must be verified.

---

### 6. Verify Service Account (For Admin SDK)

**Location**: Firebase Console → Project Settings → Service Accounts

**Steps**:
1. Go to https://console.firebase.google.com/project/countcard-94c5b/settings/serviceaccounts/adminsdk
2. Verify service account exists: `firebase-adminsdk-xxxxx@countcard-94c5b.iam.gserviceaccount.com`
3. If needed, click **Generate new private key** to create/download service account JSON
4. Extract values for `.env.local`:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

**Note**: You should already have this configured in `.env.local` from the environment setup.

---

### 7. Enable Required APIs (If Not Already Enabled)

**Location**: Google Cloud Console → APIs & Services → Library

**Steps**:
1. Go to https://console.cloud.google.com/apis/library?project=countcard-94c5b
2. Verify these APIs are enabled:
   - ✅ **Identity Toolkit API** (for Authentication)
   - ✅ **Cloud Firestore API** (for Firestore)
   - ✅ **Cloud Storage API** (if using Firebase Storage)
   - ✅ **Cloud Functions API** (if using Cloud Functions)
   - ✅ **Cloud Logging API** (for error reporting)

**To Enable**:
- Search for each API
- Click on it
- Click **Enable** if not already enabled

---

### 8. Verify Firebase Storage (If Using File Uploads)

**Location**: Firebase Console → Storage

**Steps**:
1. Go to https://console.firebase.google.com/project/countcard-94c5b/storage
2. If Storage is not initialized:
   - Click **Get started**
   - Choose **Production mode** (we'll add security rules later)
   - Select storage location (same as Firestore recommended)
   - Click **Done**
3. Verify storage bucket name matches `.env.local`:
   - Should be: `countcard-94c5b.firebasestorage.app` or `countcard-94c5b.appspot.com`

---

### 9. Set Up Error Reporting (Optional but Recommended)

**Location**: Firebase Console → Google Cloud Console → Error Reporting

**Steps**:
1. Go to https://console.cloud.google.com/errors?project=countcard-94c5b
2. Error Reporting should be automatically enabled
3. Verify it's working by checking for any existing errors
4. Set up alerting if desired (email notifications for critical errors)

---

### 10. Verify Billing (If Using Paid Features)

**Location**: Firebase Console → Usage and billing

**Steps**:
1. Go to https://console.firebase.google.com/project/countcard-94c5b/usage
2. Check current usage
3. Verify billing account is linked if using paid features
4. Review quotas and limits

**Note**: 
- Firestore has a free tier (50K reads, 20K writes, 20K deletes per day)
- Authentication has a free tier (50K MAU - Monthly Active Users)
- Storage has a free tier (5GB storage, 1GB downloads per day)

---

## 🔧 Deployment Commands

### Deploy Everything
```bash
cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
firebase deploy
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Deploy Only Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```

### Deploy Only Hosting
```bash
firebase deploy --only hosting
```

### Deploy Rules and Indexes Together
```bash
firebase deploy --only firestore
```

---

## ✅ Verification Checklist

After completing the steps above, verify:

- [ ] Firestore database is created and accessible
- [ ] Firestore security rules are deployed
- [ ] Firestore indexes are deployed and built
- [ ] Authentication providers are all enabled
- [ ] Authorized domains include production domain
- [ ] OAuth consent screen is configured (for Google/Apple)
- [ ] Service account exists and credentials are in `.env.local`
- [ ] Required APIs are enabled in Google Cloud Console
- [ ] Firebase Storage is initialized (if needed)
- [ ] Error Reporting is accessible
- [ ] Billing is set up (if using paid features)

---

## 🚨 Important Notes

1. **Security Rules**: Current rules deny all access. This is intentional and will be expanded in Sprint 14 with proper role-based access control. For now, this prevents unauthorized access.

2. **Indexes**: Some indexes may take time to build. Check the Firebase Console to see build status. Queries will fail until indexes are built.

3. **OAuth**: Google and Apple OAuth require proper domain verification and consent screen configuration. Test with test users first.

4. **Service Account**: Keep the private key secure. Never commit it to version control. It's already in `.gitignore`.

5. **Environment Variables**: Ensure all Firebase configuration values in `.env.local` match what's in Firebase Console.

---

## 📚 Related Documentation

- [Environment Variables Setup Guide](./ENV-SETUP-GUIDE.md)
- [Firebase Authentication Guide](./scripts/FIREBASE-AUTH-GUIDE.md)
- [Sprint 1 Documentation](./sprints/Sprint-1-2026-01-17/Sprint-1-2026-01-17.md)
- [Firestore Security Rules](./firestore.rules)
- [Firestore Indexes](./firestore.indexes.json)

---

## 🆘 Troubleshooting

### Firestore Not Accessible
- Verify database is created in Firebase Console
- Check that Firestore API is enabled
- Verify security rules are deployed

### Authentication Not Working
- Check authorized domains include your domain
- Verify OAuth consent screen is configured
- Check that authentication providers are enabled

### Indexes Not Building
- Wait a few minutes (indexes can take time to build)
- Check Firebase Console for error messages
- Verify index definitions in `firestore.indexes.json` are correct

### Service Account Issues
- Regenerate private key if needed
- Verify credentials in `.env.local` match service account
- Check IAM permissions in Google Cloud Console

---

**Last Updated**: January 17, 2026
