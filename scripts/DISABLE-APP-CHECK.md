# How to Disable App Check/reCAPTCHA in Firebase

This guide shows you how to disable App Check enforcement in Firebase using three different methods.

## Method 1: Firebase Console (Easiest - Recommended)

### Step 1: Navigate to App Check
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. You'll see a list of your registered apps

### Step 2: Disable Enforcement for Services
1. Click on your web app (App ID: `1:36792557920:web:84f657866a2c35e75bbe05`)
2. You'll see a list of services (Firestore, Storage, Functions, etc.)
3. For each service, toggle the enforcement switch to **OFF** or set to **UNENFORCED**
4. Services will show:
   - **ENFORCED** = App Check is blocking requests
   - **UNENFORCED** = App Check is monitoring but not blocking
   - **OFF** = App Check is disabled

### Step 3: Verify
- After disabling, authentication should work without App Check tokens
- You can still see metrics, but enforcement is disabled

**Note**: This disables enforcement but keeps App Check registered. To completely remove App Check, see Method 3.

---

## Method 2: gcloud CLI (Command Line)

### Disable Enforcement for Firestore
```bash
gcloud firebase appcheck services update firestore \
  --enforcement-mode=UNENFORCED \
  --project=countcard-94c5b
```

### Disable Enforcement for Storage
```bash
gcloud firebase appcheck services update storage \
  --enforcement-mode=UNENFORCED \
  --project=countcard-94c5b
```

### Disable Enforcement for Functions (if used)
```bash
gcloud firebase appcheck services update cloudfunctions \
  --enforcement-mode=UNENFORCED \
  --project=countcard-94c5b
```

### Check Current Enforcement Status
```bash
# List all services and their enforcement status
gcloud firebase appcheck services list --project=countcard-94c5b

# Get details for a specific service
gcloud firebase appcheck services describe firestore --project=countcard-94c5b
```

### Enforcement Modes
- `ENFORCED` - App Check is required (blocks requests without valid tokens)
- `UNENFORCED` - App Check is monitored but not required (allows all requests)
- Note: There's no explicit "OFF" mode via CLI, use `UNENFORCED` instead

---

## Method 3: Remove App Check Registration (Complete Removal)

### Via Firebase Console
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/appcheck
2. Click on your app
3. Click the "Delete" or "Remove" button (usually in the top right or settings menu)
4. Confirm deletion

**⚠️ Warning**: This completely removes App Check registration. You'll need to re-register if you want to use it again later.

### Via gcloud CLI
```bash
# Delete the App Check app registration
gcloud firebase appcheck apps delete 1:36792557920:web:84f657866a2c35e75bbe05 \
  --project=countcard-94c5b
```

**Note**: This requires the full app ID format. Get it from:
```bash
gcloud firebase appcheck apps list --project=countcard-94c5b
```

---

## Method 4: Disable in Code (Client-Side Only)

This method prevents App Check from initializing in your application, but doesn't change Firebase settings.

### Option A: Use Environment Variable (Recommended)
Add to `.env.local`:
```env
NEXT_PUBLIC_DISABLE_APP_CHECK=true
```

### Option B: Remove reCAPTCHA Keys
Remove or comment out these lines in `.env.local`:
```env
# NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=...
# NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY=...
```

**Note**: This only prevents App Check from initializing in your code. If enforcement is enabled in Firebase Console, requests may still be blocked. Use this in combination with Method 1 or 2.

---

## Quick Reference

### Check Current Status
```bash
# List all App Check apps
gcloud firebase appcheck apps list --project=countcard-94c5b

# List service enforcement status
gcloud firebase appcheck services list --project=countcard-94c5b

# Get app details
gcloud firebase appcheck apps describe 1:36792557920:web:84f657866a2c35e75bbe05 \
  --project=countcard-94c5b
```

### Firebase Console Links
- **App Check Dashboard**: https://console.firebase.google.com/project/countcard-94c5b/appcheck
- **Authentication Settings**: https://console.firebase.google.com/project/countcard-94c5b/authentication/settings

---

## Recommended Approach for Development

1. **Disable enforcement in Firebase Console** (Method 1) - This allows you to test without App Check blocking requests
2. **Keep App Check registered** - So you can re-enable it later
3. **Use `NEXT_PUBLIC_DISABLE_APP_CHECK=true`** in `.env.local` - Prevents App Check from initializing in code
4. **Monitor metrics** - You can still see App Check activity even with enforcement disabled

This way, you can:
- Test authentication without App Check interference
- Re-enable App Check easily when ready
- Still see metrics and debug information

---

## Re-enabling App Check Later

When you're ready to re-enable:

1. **Via Console**: Toggle enforcement back to **ENFORCED** for each service
2. **Via CLI**:
   ```bash
   gcloud firebase appcheck services update firestore \
     --enforcement-mode=ENFORCED \
     --project=countcard-94c5b
   ```
3. **In Code**: Remove `NEXT_PUBLIC_DISABLE_APP_CHECK=true` from `.env.local` or set it to `false`

---

## Troubleshooting

### "App Check is still blocking requests"
- Verify enforcement is set to `UNENFORCED` in Firebase Console
- Check that you've disabled enforcement for ALL services (Firestore, Storage, Functions)
- Wait a few minutes for changes to propagate

### "Can't find App Check in Console"
- Make sure you're in the correct project: `countcard-94c5b`
- App Check may not be visible if no apps are registered
- Try navigating directly: https://console.firebase.google.com/project/countcard-94c5b/appcheck

### "gcloud command not found"
- Install gcloud CLI: https://cloud.google.com/sdk/docs/install
- Authenticate: `gcloud auth login`
- Set project: `gcloud config set project countcard-94c5b`
