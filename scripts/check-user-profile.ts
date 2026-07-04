/**
 * Check User Profile in Firestore
 * Uses Firebase Admin SDK to check if a user profile exists.
 * All output is PII-safe (UID and profile data masked).
 */

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { sanitizeForLogging, sanitizeObject } from '@/lib/utils/logger';

const USER_ID = 'uKmylclPNhP4OYWAb1kSRLjl8g33';

function out(msg: string): void {
  process.stdout.write(msg + '\n');
}

function err(msg: string): void {
  process.stderr.write(msg + '\n');
}

async function checkUserProfile() {
  try {
    out('Checking user profile (UID masked for compliance)');
    out('');

    const profileRef = adminDb.collection('userProfiles').doc(USER_ID);
    const profileSnap = await profileRef.get();

    if (profileSnap.exists) {
      const profileData = profileSnap.data();
      out('✅ User profile EXISTS in Firestore');
      out('');
      out('Profile Data (sanitized):');
      out(JSON.stringify(sanitizeObject(profileData), null, 2));
    } else {
      out('❌ User profile DOES NOT EXIST in Firestore');
      out('');
      out('The user profile document needs to be created.');
      out('This should happen when the user completes profile creation.');
    }

    try {
      const userRecord = await adminAuth.getUser(USER_ID);
      out('');
      out('✅ User EXISTS in Firebase Authentication');
      out('');
      out('User Info (sanitized):');
      out(`  Email: ${sanitizeForLogging(userRecord.email || 'N/A')}`);
      out(`  Display Name: ${sanitizeForLogging(userRecord.displayName || 'N/A')}`);
      out(`  Created: ${userRecord.metadata.creationTime}`);
      out(`  Last Sign In: ${userRecord.metadata.lastSignInTime || 'N/A'}`);
      out(`  Email Verified: ${userRecord.emailVerified}`);
    } catch (authError: unknown) {
      const code = authError && typeof authError === 'object' && 'code' in authError ? (authError as { code: string }).code : '';
      if (code === 'auth/user-not-found') {
        out('');
        out('❌ User DOES NOT EXIST in Firebase Authentication');
      } else {
        throw authError;
      }
    }
  } catch (error) {
    err('Error checking user profile: ' + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

checkUserProfile()
  .then(() => {
    out('');
    out('✅ Check complete');
    process.exit(0);
  })
  .catch((error: unknown) => {
    err('Fatal error: ' + (error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
