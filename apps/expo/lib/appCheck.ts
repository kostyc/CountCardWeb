import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getApps } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';

let appCheck: AppCheck | null = null;

/**
 * Initialize Firebase App Check for Expo.
 * - Web: reCAPTCHA Enterprise
 * - Dev native: debug token via JS SDK
 * - Production EAS builds: @react-native-firebase/app-check (App Attest / Play Integrity)
 */
export function initAppCheck(): AppCheck | null {
  if (appCheck) return appCheck;
  if (getApps().length === 0) return null;

  const extra = Constants.expoConfig?.extra ?? {};
  const app = getApps()[0];
  const disableAppCheck = process.env.EXPO_PUBLIC_DISABLE_APP_CHECK === 'true';
  if (disableAppCheck) return null;

  try {
    if (Platform.OS === 'web') {
      const siteKey = extra.recaptchaSiteKey as string | undefined;
      if (!siteKey) return null;
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      return appCheck;
    }

    if (__DEV__) {
      const debugToken = process.env.EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN;
      if (!debugToken) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider('6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp'),
        isTokenAutoRefreshEnabled: true,
      });
      return appCheck;
    }

    void initNativeAppCheck();
    return appCheck;
  } catch {
    return null;
  }
}

async function initNativeAppCheck(): Promise<void> {
  try {
    const mod = await import('@react-native-firebase/app-check');
    const rnfbAppCheck = mod.default;
    const provider = rnfbAppCheck().newReactNativeFirebaseAppCheckProvider();
    provider.configure({
      android: { provider: 'playIntegrity' },
      apple: { provider: 'appAttestWithDeviceCheckFallback' },
    });
    await rnfbAppCheck().initializeAppCheck({
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    // Native module not linked (Expo Go) — register App Attest / Play Integrity in Firebase Console for EAS
  }
}

export { appCheck };
