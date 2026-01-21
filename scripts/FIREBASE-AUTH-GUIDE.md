# Firebase and Google Cloud Authentication Guide

## Current Status

### ❌ Google Cloud Authentication
- **Status**: Requires reauthentication
- **Account**: `info@warriorwaypoint.com` (listed but tokens expired)
- **Current Project**: `dateai-eda29` (needs to be changed to `countcard-94c5b`)
- **Action Required**: Run `gcloud auth login`

### ❌ Firebase Authentication
- **Status**: Requires reauthentication
- **Action Required**: Run `firebase login --reauth`

## Authentication Steps

### 1. Firebase Reauthentication

Firebase credentials have expired and need to be refreshed. To authenticate:

```bash
cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
firebase login --reauth
```

**What to expect:**
1. The command will open your default web browser
2. You'll be prompted to sign in with your Google account
3. Grant permissions to Firebase CLI
4. Return to the terminal - authentication will complete automatically

**Verify authentication:**
```bash
firebase projects:list
```

You should see `countcard-94c5b` in the list of projects.

### 2. Google Cloud Reauthentication

Google Cloud credentials have expired and need to be refreshed. To authenticate:

```bash
cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
gcloud auth login
```

**What to expect:**
1. The command will open your default web browser
2. You'll be prompted to sign in with your Google account (`info@warriorwaypoint.com`)
3. Grant permissions to Google Cloud CLI
4. Return to the terminal - authentication will complete automatically

**After authentication, set the project:**
```bash
gcloud config set project countcard-94c5b
gcloud auth application-default set-quota-project countcard-94c5b
```

**Verify authentication and project:**
```bash
gcloud auth list
gcloud config get-value project
```

Should return: `countcard-94c5b`

## Next Steps After Authentication

**Important**: Complete both authentication steps above before proceeding.

Once both are authenticated:

1. **Initialize Firebase in the project:**
   ```bash
   firebase init
   ```
   - Select **Hosting** service
   - Choose project: `countcard-94c5b`
   - Configure hosting settings for Next.js

2. **Verify Firebase project access:**
   ```bash
   firebase projects:list
   firebase use countcard-94c5b
   ```

## Troubleshooting

### Firebase Authentication Issues

**If `firebase login` fails:**
- Ensure you have internet connectivity
- Try clearing Firebase cache: `firebase logout` then `firebase login`
- For CI/CD environments, use: `firebase login:ci`

**If project not found:**
- Verify you have access to the `countcard-94c5b` project
- Check Firebase Console: https://console.firebase.google.com/
- Ensure you're using the correct Google account

### Google Cloud Authentication Issues

**If project access denied:**
- Verify account has access to `countcard-94c5b` project
- Check IAM permissions in Google Cloud Console
- Try re-authenticating: `gcloud auth login`

**To switch accounts:**
```bash
gcloud auth login
gcloud config set account YOUR_EMAIL@example.com
```

## Quick Status Check

Run the setup script to check authentication status:

```bash
./scripts/setup-firebase-auth.sh
```

This will show the current authentication status for both Firebase and Google Cloud.
