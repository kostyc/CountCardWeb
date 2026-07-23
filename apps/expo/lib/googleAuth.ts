import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import {
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import { requireAuth } from '@/lib/firebase';
import { formatAuthError } from '@/lib/authErrors';

WebBrowser.maybeCompleteAuthSession();

function getGoogleClientIds() {
  const extra = Constants.expoConfig?.extra ?? {};
  const fromEnv = (key: string) => {
    const value = process.env[key];
    return value && value.length > 0 ? value : undefined;
  };
  return {
    webClientId:
      (extra.googleWebClientId as string) || fromEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
    iosClientId:
      (extra.googleIosClientId as string) || fromEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    androidClientId:
      (extra.googleAndroidClientId as string) || fromEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
  };
}

/** Web redirect URI — register http://localhost:8081 in Google Cloud Console for Expo web. */
export function getGoogleRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'countcard',
    path: 'oauth',
  });
}

/** iOS Google OAuth client requires reversed-client-id redirect, not bundle-id. */
export function getGoogleIosRedirectUri(iosClientId: string): string {
  const clientIdCore = iosClientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${clientIdCore}:/oauthredirect`;
}

export function useGoogleAuthRequest() {
  const { webClientId, iosClientId, androidClientId } = getGoogleClientIds();

  // Native: platform OAuth client + correct redirect URI per OS.
  // iOS must use REVERSED_CLIENT_ID (not com.countcard.app) or Google blocks with invalid_request.
  // Do not use countcard://oauth with the web client — that triggers Google's OAuth policy error.
  if (Platform.OS !== 'web') {
    const redirectUriOptions =
      Platform.OS === 'ios' && iosClientId
        ? { native: getGoogleIosRedirectUri(iosClientId) }
        : {};

    return Google.useIdTokenAuthRequest(
      {
        clientId: webClientId,
        iosClientId,
        androidClientId,
      },
      redirectUriOptions
    );
  }

  return Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId,
    androidClientId,
    redirectUri: getGoogleRedirectUri(),
  });
}

export async function signInWithGoogleIdToken(idToken: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(requireAuth(), credential);
}

/** Web: Firebase popup (no redirect_uri). Native: use promptGoogleSignIn from useGoogleAuthRequest. */
export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(requireAuth(), provider);
    return;
  }

  throw new Error('Use signInWithGoogleNativePrompt on native platforms');
}

/** Native: link Google via ID token. Must use linkWithCredential (not signIn). */
export async function linkWithGoogleIdToken(idToken: string): Promise<void> {
  const user = requireAuth().currentUser;
  if (!user) {
    throw new Error('You must be signed in to link Google');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  try {
    await linkWithCredential(user, credential);
  } catch (e) {
    if (getAuthCode(e) === 'auth/provider-already-linked') {
      return;
    }
    throw new Error(formatAuthError(e, 'Failed to link Google'));
  }
}

/** Web: link Google via popup. Native: use linkWithGoogleIdToken after prompt. */
export async function linkWithGoogle(): Promise<void> {
  if (Platform.OS !== 'web') {
    throw new Error('Use linkWithGoogleIdToken on native platforms');
  }
  const user = requireAuth().currentUser;
  if (!user) {
    throw new Error('You must be signed in to link Google');
  }
  const provider = new GoogleAuthProvider();
  try {
    await linkWithPopup(user, provider);
  } catch (e) {
    if (getAuthCode(e) === 'auth/provider-already-linked') {
      return;
    }
    throw new Error(formatAuthError(e, 'Failed to link Google'));
  }
}

function getAuthCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function isGoogleSignInConfigured(): boolean {
  const { webClientId, iosClientId, androidClientId } = getGoogleClientIds();
  if (!webClientId) return false;
  if (Platform.OS === 'ios') return Boolean(iosClientId);
  if (Platform.OS === 'android') return Boolean(androidClientId);
  return true;
}

export function isGoogleNativeAuthFlow(): boolean {
  return Platform.OS !== 'web';
}
