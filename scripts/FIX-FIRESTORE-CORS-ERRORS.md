# Fix Firestore CORS Errors on Dashboard

## Problem

After logging in and reaching the `/dashboard` page, you're seeing:
- **CORS errors**: "Fetch API cannot load https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel... due to access control checks"
- **404 error**: Missing resource
- **Syntax error**: Unexpected EOF in app_layout

## Root Cause

The Firestore security rules are very restrictive and may be blocking real-time listeners. The `firestore.rules` file currently only allows:
- Users to read/write their own `userProfiles`
- Everything else is denied

If any component is trying to set up real-time listeners on other collections, they'll fail.

## Solutions

### Solution 1: Verify Firestore Rules Are Deployed

The rules might not be deployed to Firebase. Deploy them:

```bash
cd "/Users/daddymac/Documents/App Development/CountCard/CountCardWeb"
firebase deploy --only firestore:rules
```

### Solution 2: Check What's Being Accessed

The `AuthContext` tries to load the user profile when you log in. This should work if:
1. The user profile document exists in Firestore
2. The security rules allow the user to read their own profile

**Check if user profile exists**:
1. Go to: https://console.firebase.google.com/project/countcard-94c5b/firestore
2. Navigate to `userProfiles` collection
3. Look for a document with your user ID
4. If it doesn't exist, create it (or the app should create it on first login)

### Solution 3: Temporarily Relax Rules for Testing

**⚠️ WARNING**: Only do this for development/testing. Never use in production.

Update `firestore.rules` temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow authenticated users to read their own data
    // This is for development only - will be replaced with proper rules in Sprint 14
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // User Profiles: Users can read/write their own profile
    match /userProfiles/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
    
    // TEMPORARY: Allow read access to all collections for authenticated users
    // Remove this in production!
    match /{document=**} {
      allow read: if isAuthenticated();
      allow write: if false; // Still block writes for safety
    }
  }
}
```

Then deploy:
```bash
firebase deploy --only firestore:rules
```

### Solution 4: Fix the 404 Error

The 404 error might be from:
- A missing static file
- A Next.js build issue
- A missing route

**Try**:
1. Clear `.next` directory: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Check browser console for the exact 404 path

### Solution 5: Fix the Syntax Error

The "Unexpected EOF" error suggests a malformed JavaScript file. This could be:
- A build cache issue
- A corrupted file

**Try**:
1. Clear build cache: `rm -rf .next`
2. Clear node_modules cache: `rm -rf node_modules/.cache`
3. Restart dev server

## Step-by-Step Fix

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Verify User Profile Exists**:
   - Check Firebase Console → Firestore → `userProfiles` collection
   - If missing, the app should create it on first profile creation

3. **Clear Build Cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

4. **Check Browser Console**:
   - Look for specific error messages
   - Check Network tab for failed requests

5. **Test Authentication Flow**:
   - Log out
   - Log back in
   - Check if errors persist

## Expected Behavior After Fix

- No CORS errors in console
- User profile loads successfully
- Dashboard displays correctly
- No 404 errors
- No syntax errors

## If Errors Persist

1. **Check Firestore Console**:
   - Go to: https://console.firebase.google.com/project/countcard-94c5b/firestore
   - Check if database exists
   - Check if `userProfiles` collection exists

2. **Check Authentication**:
   - Verify user is authenticated
   - Check Firebase Console → Authentication → Users
   - Verify your user exists

3. **Check Network Tab**:
   - Open browser DevTools → Network tab
   - Look for failed requests to Firestore
   - Check response status codes and error messages

4. **Check Firestore Rules**:
   - Go to: https://console.firebase.google.com/project/countcard-94c5b/firestore/rules
   - Verify rules match your `firestore.rules` file
   - Test rules using the Rules Playground

## Long-Term Solution

The restrictive rules are intentional (security-first approach). In Sprint 14, proper role-based access control will be implemented. For now, the temporary relaxed rules (Solution 3) should allow the app to function while maintaining some security.
