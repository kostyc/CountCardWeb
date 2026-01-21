/**
 * Check User Profile in Firestore
 * Uses Firebase Admin SDK to check if a user profile exists
 */

import { adminDb, adminAuth } from '@/lib/firebase/admin';

const USER_ID = 'uKmylclPNhP4OYWAb1kSRLjl8g33';

async function checkUserProfile() {
  try {
    console.log(`Checking user profile for UID: ${USER_ID}`);
    console.log('');

    // Check user profile in Firestore
    const profileRef = adminDb.collection('userProfiles').doc(USER_ID);
    const profileSnap = await profileRef.get();

    if (profileSnap.exists) {
      const profileData = profileSnap.data();
      console.log('✅ User profile EXISTS in Firestore');
      console.log('');
      console.log('Profile Data:');
      console.log(JSON.stringify(profileData, null, 2));
    } else {
      console.log('❌ User profile DOES NOT EXIST in Firestore');
      console.log('');
      console.log('The user profile document needs to be created.');
      console.log('This should happen when the user completes profile creation.');
    }

    // Also check if user exists in Firebase Authentication
    try {
      const userRecord = await adminAuth.getUser(USER_ID);
      console.log('');
      console.log('✅ User EXISTS in Firebase Authentication');
      console.log('');
      console.log('User Info:');
      console.log(`  Email: ${userRecord.email || 'N/A'}`);
      console.log(`  Display Name: ${userRecord.displayName || 'N/A'}`);
      console.log(`  Created: ${userRecord.metadata.creationTime}`);
      console.log(`  Last Sign In: ${userRecord.metadata.lastSignInTime || 'N/A'}`);
      console.log(`  Email Verified: ${userRecord.emailVerified}`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log('');
        console.log('❌ User DOES NOT EXIST in Firebase Authentication');
      } else {
        throw authError;
      }
    }
  } catch (error) {
    console.error('Error checking user profile:', error);
    process.exit(1);
  }
}

checkUserProfile()
  .then(() => {
    console.log('');
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
