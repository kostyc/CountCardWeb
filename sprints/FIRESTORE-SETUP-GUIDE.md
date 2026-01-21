# Firestore Database Setup Guide

**Sprint**: Sprint 1 - Task 3  
**Status**: Manual Step Required  
**Priority**: High

## Overview

This guide provides step-by-step instructions for creating the Firestore database in the Firebase Console. This is a manual step that must be completed before deploying Firestore security rules and indexes.

## Prerequisites

- Firebase project `countcard-94c5b` must be accessible
- Firebase CLI authenticated (completed in Sprint 1)
- Firebase project initialized (completed in Sprint 1)

## Step-by-Step Instructions

### Step 1: Access Firebase Console

1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Select the project: **CountCard** (`countcard-94c5b`)
3. If prompted, verify you have access to the project

### Step 2: Create Firestore Database

1. In the Firebase Console, click on **Firestore Database** in the left sidebar
2. If you see a message "Cloud Firestore has not been set up for this project", click **Create database**
3. If Firestore is already created, skip to Step 3

### Step 3: Choose Database Mode

1. Select **Start in production mode** (recommended)
   - This sets up restrictive security rules by default
   - Our security rules will be deployed separately
2. Click **Next**

### Step 4: Choose Database Location

1. Select a location for your Firestore database
   - **Recommended**: Choose a location closest to your users
   - For US-based users: `us-central1` or `us-east1` are good options
   - **Important**: Once set, the location cannot be changed
2. Click **Enable**

### Step 5: Wait for Database Creation

- The database creation process may take a few minutes
- You'll see a progress indicator in the Firebase Console
- Once complete, you'll see the Firestore Database interface

### Step 6: Verify Database Creation

1. In the Firestore Database interface, verify you can see:
   - **Data** tab (showing empty collections)
   - **Rules** tab (showing default rules)
   - **Indexes** tab (showing no indexes yet)
   - **Usage** tab (showing database statistics)

### Step 7: Deploy Security Rules and Indexes

Once the database is created, deploy the security rules and indexes:

```bash
# Navigate to project root
cd /Users/daddymac/Documents/App\ Development/CountCard/CountCardWeb

# Deploy Firestore rules and indexes
firebase deploy --only firestore
```

**Expected Output**:
```
=== Deploying to 'countcard-94c5b'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
i  firestore: checking firestore.indexes.json for errors...
✔  firestore: rules file firestore.rules compiled successfully
✔  firestore: indexes file firestore.indexes.json validated successfully
i  firestore: deploying rules...
✔  firestore: released rules firestore.rules to firestore
i  firestore: deploying indexes...
✔  firestore: released indexes firestore.indexes.json to firestore

✔  Deploy complete!
```

### Step 8: Verify Deployment

1. In Firebase Console, go to **Firestore Database** > **Rules**
2. Verify that the rules from `firestore.rules` are deployed
3. Go to **Firestore Database** > **Indexes**
4. Verify that indexes from `firestore.indexes.json` are listed (if any)

## Collection Structure

The following collections will be created automatically when data is first written:

- `recruits` - Recruit profiles and information
- `countCards` - Accountability records
- `platoons` - Platoon/squad organization
- `emergencyContacts` - Emergency contact information
- `userProfiles` - User account profiles
- `conversations` - Human-to-human messaging
- `adminLogs` - Administrative action logs
- `encryptionKeys` - User encryption keys (encrypted)
- `encryptionConfig` - Encryption configuration per user

**Note**: Collections are created automatically when the first document is written. You don't need to create them manually.

## Security Rules

The initial security rules (`firestore.rules`) are restrictive and deny all access by default. This is intentional for security. Security rules will be fully implemented in Sprint 14.

**Current Rules** (from `firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default: deny all access
    // Security rules will be fully implemented in Sprint 14
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Indexes

Indexes are configured in `firestore.indexes.json`. The initial configuration may be empty or contain basic indexes. Additional indexes will be added as needed for query patterns.

## Testing the Connection

After creating the database and deploying rules, test the connection:

```bash
# Run the Firestore connection test (if available)
# Or test manually by running the application and attempting to write data
```

## Troubleshooting

### Issue: "Firestore has not been set up for this project"

**Solution**: Follow Step 2 above to create the database.

### Issue: "Permission denied" when deploying rules

**Solution**: 
1. Verify you're authenticated: `firebase login`
2. Verify you have the correct project selected: `firebase use countcard-94c5b`
3. Verify you have the necessary permissions in the Firebase project

### Issue: "Database location cannot be changed"

**Solution**: This is expected behavior. Once a location is set, it cannot be changed. If you need a different location, you would need to create a new project (not recommended).

### Issue: Rules deployment fails

**Solution**:
1. Check `firestore.rules` for syntax errors
2. Verify the rules file is in the project root
3. Try deploying again: `firebase deploy --only firestore:rules`

### Issue: Indexes deployment fails

**Solution**:
1. Check `firestore.indexes.json` for JSON syntax errors
2. Verify the indexes file is in the project root
3. Try deploying again: `firebase deploy --only firestore:indexes`

## Next Steps

After completing this setup:

1. ✅ Firestore database created
2. ✅ Security rules deployed
3. ✅ Indexes deployed (if any)
4. ✅ Connection test utility available (`lib/firebase/test-connection.ts`)

You can now proceed with:
- Sprint 2: Authentication System (can proceed without Firestore, but Firestore is needed for user profiles)
- Sprint 3: Encryption System (requires Firestore for key storage)
- Future sprints that require database operations

## Related Documentation

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Sprint 1 Documentation](../Sprint-1-2026-01-17/Sprint-1-2026-01-17.md)

## Notes

- **Database Location**: Choose carefully - it cannot be changed after creation
- **Security Rules**: Initial rules are restrictive by design - will be fully implemented in Sprint 14
- **Collections**: Created automatically when first document is written
- **Indexes**: May need to be added as query patterns are developed
- **Testing**: Test connection after setup to verify everything works

---

**Last Updated**: January 17, 2026  
**Status**: Ready for manual execution
