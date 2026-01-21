# Firebase API Check and Enable Guide

## Quick Check Commands

### Check All Enabled APIs
```bash
gcloud services list --enabled --project=countcard-94c5b
```

### Check Specific Required APIs

#### Identity Toolkit API (Firebase Authentication)
```bash
gcloud services list --enabled --filter="name:identitytoolkit.googleapis.com" --project=countcard-94c5b
```

#### Cloud Firestore API
```bash
gcloud services list --enabled --filter="name:firestore.googleapis.com" --project=countcard-94c5b
```

#### Cloud Storage API
```bash
gcloud services list --enabled --filter="name:storage-component.googleapis.com" --project=countcard-94c5b
```

#### Cloud Logging API
```bash
gcloud services list --enabled --filter="name:logging.googleapis.com" --project=countcard-94c5b
```

## Enable Missing APIs

### Enable All Required APIs at Once
```bash
# Set project
gcloud config set project countcard-94c5b

# Enable Identity Toolkit API (Firebase Authentication)
gcloud services enable identitytoolkit.googleapis.com --project=countcard-94c5b

# Enable Cloud Firestore API
gcloud services enable firestore.googleapis.com --project=countcard-94c5b

# Enable Cloud Storage API
gcloud services enable storage-component.googleapis.com --project=countcard-94c5b

# Enable Cloud Logging API
gcloud services enable logging.googleapis.com --project=countcard-94c5b

# Enable Cloud Functions API (if using Functions)
gcloud services enable cloudfunctions.googleapis.com --project=countcard-94c5b

# Enable Firebase App Check API (if using App Check)
gcloud services enable appcheck.googleapis.com --project=countcard-94c5b
```

## Using the Automated Script

Run the automated check script:

```bash
cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
./scripts/check-firebase-apis.sh
```

This script will:
1. Check which APIs are enabled
2. Show a summary of enabled/disabled APIs
3. Offer to enable missing APIs automatically

## Required APIs for Authentication

### Critical (Must Be Enabled)
- **Identity Toolkit API** (`identitytoolkit.googleapis.com`)
  - Required for Firebase Authentication (Email/Password, Phone, Google, Apple)
  - Without this, authentication will fail

- **Cloud Firestore API** (`firestore.googleapis.com`)
  - Required for Firestore database operations
  - Used for storing user profiles and application data

### Important (Should Be Enabled)
- **Cloud Storage API** (`storage-component.googleapis.com`)
  - Required for Firebase Storage (file uploads, profile pictures)
  - Used for storing user-uploaded files

- **Cloud Logging API** (`logging.googleapis.com`)
  - Required for error reporting and logging
  - Helps with debugging and monitoring

### Optional (Enable If Using)
- **Cloud Functions API** (`cloudfunctions.googleapis.com`)
  - Only needed if using Cloud Functions

- **Firebase App Check API** (`appcheck.googleapis.com`)
  - Only needed if using App Check for bot protection

## Verify Authentication Setup

After enabling APIs, verify authentication is configured:

1. **Check Firebase Authentication Providers**:
   ```bash
   # This requires Firebase CLI
   firebase auth:export users.json --project=countcard-94c5b
   ```

2. **Check OAuth Consent Screen** (for Google/Apple sign-in):
   - Go to: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b
   - Verify OAuth consent screen is configured
   - Check authorized domains include your domain

3. **Check Authorized Domains** (in Firebase Console):
   - Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings
   - Verify authorized domains include:
     - `localhost` (for development)
     - `countcard.warriorwaypoint.com` (your custom domain)

## Troubleshooting

### If Authentication Still Fails After Enabling APIs

1. **Wait a few minutes**: APIs can take 1-5 minutes to fully activate
2. **Check API status**:
   ```bash
   gcloud services list --enabled --project=countcard-94c5b | grep identitytoolkit
   ```
3. **Verify Firebase project**:
   ```bash
   firebase projects:list
   ```
4. **Check Firebase Authentication is enabled in Console**:
   - Go to: https://console.firebase.google.com/project/countcard-94c5b/authentication
   - Verify "Get started" button is not showing (means it's enabled)

### Common Issues

**Issue**: "API not enabled" error
- **Solution**: Run the enable commands above and wait 2-3 minutes

**Issue**: "OAuth consent screen not configured"
- **Solution**: Configure OAuth consent screen in Google Cloud Console
- See: https://console.cloud.google.com/apis/credentials/consent?project=countcard-94c5b

**Issue**: "Domain not authorized"
- **Solution**: Add domain to Firebase authorized domains
- See: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Cloud APIs Documentation](https://cloud.google.com/apis/docs/overview)
- [Firebase Console](https://console.firebase.google.com/project/countcard-94c5b)
- [Google Cloud Console](https://console.cloud.google.com/?project=countcard-94c5b)
