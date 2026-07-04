import path from 'path';
import fs from 'fs';
import { config as loadEnv } from 'dotenv';
import { ExpoConfig, ConfigContext } from 'expo/config';

loadEnv({ path: path.resolve(__dirname, '../../.env.local') });

function env(primary: string | undefined, fallback: string | undefined): string {
  return primary ?? fallback ?? '';
}

function readPlistClientId(filename: string): string {
  try {
    const content = fs.readFileSync(path.join(__dirname, filename), 'utf8');
    const match = content.match(/<key>CLIENT_ID<\/key>\s*<string>([^<]+)<\/string>/);
    return match?.[1] ?? '';
  } catch {
    return '';
  }
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: 'warriorwaypoint',
  name: 'CountCard',
  slug: 'countcard',
  version: '2026.0.2',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'countcard',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.countcard.app',
    googleServicesFile: './GoogleService-Info.plist',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: 'CountCard uses the camera to capture recruit photos.',
      NSPhotoLibraryUsageDescription: 'CountCard uses your photo library to select recruit photos.',
    },
  },
  android: {
    package: 'com.countcard.app',
    googleServicesFile: './google-services.json',
    adaptiveIcon: {
      backgroundColor: '#1a365d',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-image',
    'expo-notifications',
    'expo-image-picker',
    'expo-apple-authentication',
    '@react-native-firebase/app',
    // App Check native plugin omitted for local prebuild (Expo 57 Swift AppDelegate).
    // Dev builds use EXPO_PUBLIC_APPCHECK_DEBUG_TOKEN via JS SDK in lib/appCheck.ts.
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    './plugins/withFirebaseIosConfigure.js',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#1a365d',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    firebaseApiKey: env(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    firebaseAuthDomain: env(
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    ),
    firebaseProjectId: env(
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    firebaseStorageBucket: env(
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ),
    firebaseAppId: env(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    googleIosClientId: env(
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      readPlistClientId('GoogleService-Info.plist')
    ),
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
    recaptchaSiteKey:
      process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY ?? '6Ldjq00sAAAAALEU-AjwFoRxZqc-yiX8AjDr4BQp',
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '737c4f89-e7de-4cd9-a185-130ffe62259a',
    },
  },
});
