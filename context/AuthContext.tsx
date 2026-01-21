'use client';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  linkWithCredential,
  unlink,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  PhoneAuthCredential,
  signInWithCredential,
  ConfirmationResult,
  RecaptchaVerifier,
  updateProfile,
  UserCredential,
  ActionCodeSettings,
  OAuthCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import {
  AppUser,
  AuthState,
  AuthResult,
  EmailPasswordSignUpParams,
  EmailPasswordSignInParams,
  PhoneAuthParams,
  PasswordResetParams,
  UserProfile,
  OrganizationalAssignment,
  UserRole,
} from '@/types/auth';
import { logError, logInfo } from '@/lib/utils/logger';
import { AuthenticationError, translateFirebaseAuthError } from '@/lib/utils/errorHandler';
import { debugLog } from '@/lib/utils/debugLogger';

/**
 * Authentication context value
 */
interface AuthContextValue extends AuthState {
  // Authentication methods
  signUpWithEmail: (params: EmailPasswordSignUpParams) => Promise<AuthResult>;
  signInWithEmail: (params: EmailPasswordSignInParams) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithPhone: (params: PhoneAuthParams) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (params: PasswordResetParams) => Promise<AuthResult>;
  linkAccount: (provider: 'google' | 'apple' | 'phone', credential?: unknown) => Promise<AuthResult>;
  unlinkAccount: (providerId: string) => Promise<AuthResult>;
  refreshUser: () => Promise<void>;
}

/**
 * Create authentication context
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  /**
   * Load user profile from Firestore
   */
  const loadUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<AppUser> => {
    try {
      // Get user profile from Firestore
      const profileRef = doc(db, 'userProfiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);

      // Get custom claims (roles and organizational assignments)
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const customClaims = idTokenResult.claims;

      // Create extended user object
      // Type assertion for profile data (Firestore returns DocumentData)
      const profileData = profileSnap.exists() ? profileSnap.data() : undefined;
      const profile: UserProfile | undefined = profileData
        ? (profileData as unknown as UserProfile)
        : undefined;

      // Type assertion for custom claims (Firebase returns untyped claims)
      const role = customClaims.role as UserRole | undefined;
      const organizationalAssignment = customClaims.organizationalAssignment as
        | OrganizationalAssignment
        | undefined;

      const appUser: AppUser = {
        ...firebaseUser,
        profile,
        customClaims: {
          role,
          organizationalAssignment,
        },
      };

      return appUser;
    } catch (err) {
      logError(err as Error, 'AuthContext.loadUserProfile');
      // Return user without profile if profile load fails
      return firebaseUser as AppUser;
    }
  }, []);

  /**
   * Handle authentication state changes
   */
  useEffect(() => {
    debugLog.info('Setting up auth state listener', 'AuthContext');
    
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            debugLog.debug('Firebase user detected', 'AuthContext', {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
            });
            
            const appUser = await loadUserProfile(firebaseUser);
            setUser(appUser);
            setError(null);
            
            debugLog.info('User authenticated and profile loaded', 'AuthContext', {
              uid: appUser.uid,
              role: appUser.customClaims?.role,
              hasProfile: !!appUser.profile,
            });
          } else {
            debugLog.info('No user authenticated', 'AuthContext');
            setUser(null);
          }
        } catch (err) {
          logError(err as Error, 'AuthContext.onAuthStateChanged');
          debugLog.error('Error loading user profile', 'AuthContext', { error: err });
          setError(err as Error);
          setUser(null);
        } finally {
          setLoading(false);
          setInitialized(true);
          debugLog.debug('Auth initialization complete', 'AuthContext', {
            loading: false,
            initialized: true,
            hasUser: !!firebaseUser,
          });
        }
      },
      (err) => {
        logError(err, 'AuthContext.onAuthStateChanged');
        debugLog.error('Auth state listener error', 'AuthContext', { error: err });
        setError(err);
        setLoading(false);
        setInitialized(true);
      }
    );

    return () => {
      debugLog.debug('Cleaning up auth state listener', 'AuthContext');
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadUserProfile is stable (useCallback with empty deps), so we don't need it in deps

  /**
   * Sign up with email and password
   */
  const signUpWithEmail = useCallback(async (params: EmailPasswordSignUpParams): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);

      // Update display name if provided
      if (params.displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: params.displayName,
        });
      }

      // Create user profile in Firestore
      if (userCredential.user) {
        const profileRef = doc(db, 'userProfiles', userCredential.user.uid);
        await setDoc(profileRef, {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: params.displayName || userCredential.user.displayName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const appUser = await loadUserProfile(userCredential.user);
      setUser(appUser);

      logInfo('User signed up successfully', 'AuthContext.signUpWithEmail');
      return { success: true, user: appUser };
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signUpWithEmail');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = useCallback(async (params: EmailPasswordSignInParams): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, params.email, params.password);
      const appUser = await loadUserProfile(userCredential.user);
      setUser(appUser);

      logInfo('User signed in successfully', 'AuthContext.signInWithEmail');
      return { success: true, user: appUser };
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signInWithEmail');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const appUser = await loadUserProfile(userCredential.user);
      setUser(appUser);

      // Create or update user profile
      const profileRef = doc(db, 'userProfiles', userCredential.user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      logInfo('User signed in with Google successfully', 'AuthContext.signInWithGoogle');
      return { success: true, user: appUser };
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signInWithGoogle');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Sign in with Apple
   */
  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      const provider = new OAuthProvider('apple.com');
      const userCredential = await signInWithPopup(auth, provider);
      const appUser = await loadUserProfile(userCredential.user);
      setUser(appUser);

      // Create or update user profile
      const profileRef = doc(db, 'userProfiles', userCredential.user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          userId: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      logInfo('User signed in with Apple successfully', 'AuthContext.signInWithApple');
      return { success: true, user: appUser };
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signInWithApple');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Sign in with phone number
   * Supports two-step flow: send verification code, then verify code
   */
  const signInWithPhone = useCallback(async (params: PhoneAuthParams): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      const { phoneNumber, recaptchaVerifier, verificationCode, confirmationResult } = params;

      // Step 1: Send verification code (if no code provided)
      if (!verificationCode && !confirmationResult && recaptchaVerifier) {
        const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        return {
          success: true,
          confirmationResult: confirmation,
          message: 'Verification code sent to your phone',
        };
      }

      // Step 2: Verify code and sign in (if code provided)
      if (verificationCode && confirmationResult) {
        const credential = PhoneAuthProvider.credential(
          confirmationResult.verificationId,
          verificationCode
        );
        const userCredential = await signInWithCredential(auth, credential);
        const appUser = await loadUserProfile(userCredential.user);
        setUser(appUser);

        // Create or update user profile
        const profileRef = doc(db, 'userProfiles', userCredential.user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          await setDoc(profileRef, {
            userId: userCredential.user.uid,
            phoneNumber: userCredential.user.phoneNumber,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        logInfo('User signed in with phone successfully', 'AuthContext.signInWithPhone');
        return { success: true, user: appUser };
      }

      throw new Error('Invalid phone authentication parameters');
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signInWithPhone');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      logInfo('User signed out successfully', 'AuthContext.signOut');
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.signOut');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset password
   */
  const resetPassword = useCallback(async (params: PasswordResetParams): Promise<AuthResult> => {
    try {
      setLoading(true);
      setError(null);

      // Configure action code settings to redirect to our app's confirm page
      const actionCodeSettings: ActionCodeSettings = {
        url: typeof window !== 'undefined' 
          ? `${window.location.origin}/reset-password/confirm`
          : 'https://countcard.warriorwaypoint.com/reset-password/confirm',
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, params.email, actionCodeSettings);

      logInfo('Password reset email sent successfully', 'AuthContext.resetPassword');
      return { success: true };
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.resetPassword');
      
      // Translate Firebase error to user-friendly message
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Link account with another provider
   */
  const linkAccount = useCallback(async (provider: 'google' | 'apple' | 'phone', credential?: unknown): Promise<AuthResult> => {
    try {
      if (!user) {
        throw new AuthenticationError('User must be authenticated to link accounts');
      }

      setLoading(true);
      setError(null);

      let authCredential: any;

      if (credential) {
        // Use provided credential (for phone auth with confirmation result)
        authCredential = credential;
      } else {
        // For OAuth providers, get credential from popup
        // signInWithPopup opens a popup window, not a new tab
        if (provider === 'google') {
          const providerInstance = new GoogleAuthProvider();
          // Set custom parameters to ensure popup behavior
          providerInstance.setCustomParameters({
            prompt: 'select_account',
          });
          const result = await signInWithPopup(auth, providerInstance);
          const credentialResult = GoogleAuthProvider.credentialFromResult(result);
          if (!credentialResult) {
            throw new AuthenticationError('Failed to get credential from Google sign-in');
          }
          authCredential = credentialResult;
        } else if (provider === 'apple') {
          const providerInstance = new OAuthProvider('apple.com');
          // Apple Sign-In should also use popup
          const result = await signInWithPopup(auth, providerInstance);
          const credentialResult = OAuthProvider.credentialFromResult(result);
          if (!credentialResult) {
            throw new AuthenticationError('Failed to get credential from Apple sign-in');
          }
          authCredential = credentialResult;
        } else {
          throw new Error('Phone authentication requires credential parameter');
        }
      }

      if (!authCredential) {
        throw new AuthenticationError('Failed to get credential from provider');
      }

      // Link the credential to the current user
      await linkWithCredential(auth.currentUser!, authCredential);
      
      // Refresh user data to get updated provider info
      await refreshUser();

      logInfo(`Account linked with ${provider} successfully`, 'AuthContext.linkAccount');
      // Get the updated user after refresh
      const updatedUser = await loadUserProfile(auth.currentUser!);
      return { success: true, user: updatedUser };
    } catch (err: any) {
      const error = err as Error;
      
      // Handle specific Firebase errors
      if (err.code === 'auth/popup-blocked') {
        const errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
        logError(new Error(errorMessage), 'AuthContext.linkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      } else if (err.code === 'auth/popup-closed-by-user') {
        const errorMessage = 'Linking was cancelled. Please try again.';
        logError(new Error(errorMessage), 'AuthContext.linkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      } else if (err.code === 'auth/credential-already-in-use') {
        const errorMessage = 'This account is already linked to another user. Please sign in with that account instead.';
        logError(new Error(errorMessage), 'AuthContext.linkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      } else if (err.code === 'auth/provider-already-linked') {
        // Provider is already linked - this is actually a success case
        // Refresh user to ensure UI shows the linked provider
        await refreshUser();
        // Get the updated user after refresh
        const updatedUser = await loadUserProfile(auth.currentUser!);
        logInfo(`Provider ${provider} is already linked to account`, 'AuthContext.linkAccount');
        return { success: true, user: updatedUser, message: 'This provider is already linked to your account.' };
      } else if (err.code === 'auth/operation-not-allowed') {
        const providerName = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Phone';
        const errorMessage = `${providerName} Sign-In is not enabled in Firebase. Please enable it in the Firebase Console under Authentication > Sign-in method.`;
        logError(new Error(errorMessage), 'AuthContext.linkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      }

      // Translate other Firebase errors to user-friendly messages
      logError(error, 'AuthContext.linkAccount');
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [user]); // refreshUser is defined later, will be stable

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    if (!auth.currentUser) {
      return;
    }

    try {
      setLoading(true);
      const appUser = await loadUserProfile(auth.currentUser);
      setUser(appUser);
      setError(null);
    } catch (err) {
      const error = err as Error;
      logError(error, 'AuthContext.refreshUser');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile]);

  /**
   * Unlink account provider
   */
  const unlinkAccount = useCallback(async (providerId: string): Promise<AuthResult> => {
    try {
      if (!user || !auth.currentUser) {
        throw new AuthenticationError('User must be authenticated to unlink accounts');
      }

      // Prevent unlinking if it's the last provider
      if (user.providerData && user.providerData.length <= 1) {
        throw new AuthenticationError('Cannot unlink the last authentication provider. You must have at least one linked account.');
      }

      setLoading(true);
      setError(null);

      // Unlink the provider
      await unlink(auth.currentUser, providerId);
      
      // Refresh user data to get updated provider info
      await refreshUser();

      logInfo(`Account unlinked with ${providerId} successfully`, 'AuthContext.unlinkAccount');
      return { success: true, user: user };
    } catch (err: any) {
      const error = err as Error;
      
      // Handle specific Firebase errors
      if (err.code === 'auth/no-such-provider') {
        const errorMessage = 'This provider is not linked to your account.';
        logError(new Error(errorMessage), 'AuthContext.unlinkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      } else if (err.code === 'auth/requires-recent-login') {
        const errorMessage = 'Please sign out and sign back in before unlinking this provider.';
        logError(new Error(errorMessage), 'AuthContext.unlinkAccount');
        setError(new Error(errorMessage));
        return { success: false, error: new Error(errorMessage) };
      }

      // Translate other Firebase errors to user-friendly messages
      logError(error, 'AuthContext.unlinkAccount');
      const userFriendlyMessage = translateFirebaseAuthError(error);
      const translatedError = new Error(userFriendlyMessage);
      
      setError(translatedError);
      return { success: false, error: translatedError };
    } finally {
      setLoading(false);
    }
  }, [user, refreshUser]);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    initialized,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    signInWithPhone,
    signOut,
    resetPassword,
    linkAccount,
    unlinkAccount,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
