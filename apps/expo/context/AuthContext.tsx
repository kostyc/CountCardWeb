import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  linkWithCredential,
  unlink,
  OAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { requireAuth } from '@/lib/firebase';
import { formatAuthError } from '@/lib/authErrors';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  linkWithApple: () => Promise<void>;
  unlinkProvider: (providerId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getAppleFirebaseCredential() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple Sign-In failed — no identity token');
  }
  const provider = new OAuthProvider('apple.com');
  return provider.credential({ idToken: credential.identityToken });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(requireAuth(), (u) => {
        setUser(u);
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(requireAuth(), email, password);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(requireAuth(), email, password);
  }, []);

  const signInWithApple = useCallback(async () => {
    const firebaseCredential = await getAppleFirebaseCredential();
    await signInWithCredential(requireAuth(), firebaseCredential);
  }, []);

  const linkWithApple = useCallback(async () => {
    const currentUser = requireAuth().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to link Apple');
    }
    try {
      const firebaseCredential = await getAppleFirebaseCredential();
      await linkWithCredential(currentUser, firebaseCredential);
      await currentUser.reload();
      setUser(requireAuth().currentUser);
    } catch (e) {
      if (
        e &&
        typeof e === 'object' &&
        'code' in e &&
        (e as { code?: string }).code === 'auth/provider-already-linked'
      ) {
        return;
      }
      throw new Error(formatAuthError(e, 'Failed to link Apple'));
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = requireAuth().currentUser;
    if (!currentUser) {
      setUser(null);
      return;
    }
    await currentUser.reload();
    setUser(requireAuth().currentUser);
  }, []);

  const unlinkProvider = useCallback(async (providerId: string) => {
    const currentUser = requireAuth().currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to unlink a sign-in method');
    }
    if ((currentUser.providerData?.length ?? 0) <= 1) {
      throw new Error(
        'Cannot unlink the last sign-in method. Add another method before removing this one.'
      );
    }
    try {
      await unlink(currentUser, providerId);
      await requireAuth().currentUser?.reload();
      setUser(requireAuth().currentUser);
    } catch (e) {
      throw new Error(formatAuthError(e, 'Failed to unlink sign-in method'));
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(requireAuth());
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(requireAuth(), email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithApple,
        linkWithApple,
        unlinkProvider,
        refreshUser,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
