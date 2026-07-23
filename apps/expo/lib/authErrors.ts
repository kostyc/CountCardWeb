/** Map Firebase Auth error codes to user-facing messages (no PII). */

function getCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function formatAuthError(error: unknown, fallback: string): string {
  const code = getCode(error);

  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Sign in with email and password, then link Google or Apple under Settings → Linked sign-in methods.';
    case 'auth/credential-already-in-use':
      return 'This sign-in method is already linked to another account. Sign in with that account instead.';
    case 'auth/provider-already-linked':
      return 'This sign-in method is already linked to your account.';
    case 'auth/requires-recent-login':
      return 'For security, sign out and sign back in before changing linked sign-in methods.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Allow popups for this site and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead, or use a different email.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Contact support.';
    default:
      break;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
