/**
 * Roster document image picker — full-frame capture without square crop.
 */

import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { validateRosterDocumentImage, type PickedImage } from '@/lib/imageValidation';

export type PickRosterImageResult =
  | { ok: true; image: PickedImage }
  | { ok: false; error?: string; cancelled?: boolean };

const ROSTER_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 0.92,
  exif: false,
};

async function launchLibrary(): Promise<PickRosterImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Photo library access is required.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync(ROSTER_PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  return validateRosterDocumentImage({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  });
}

async function launchCamera(): Promise<PickRosterImageResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Camera access is required to photograph a roster.' };
  }

  const result = await ImagePicker.launchCameraAsync(ROSTER_PICKER_OPTIONS);
  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  return validateRosterDocumentImage({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  });
}

function pickSource(): Promise<'library' | 'camera' | null> {
  if (Platform.OS === 'web') {
    return Promise.resolve('library');
  }

  return new Promise((resolve) => {
    Alert.alert('Add roster page', 'Photograph one printed page at a time.', [
      { text: 'Take photo', onPress: () => resolve('camera') },
      { text: 'Photo library', onPress: () => resolve('library') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

export async function pickRosterDocumentImage(): Promise<PickRosterImageResult> {
  const source = await pickSource();
  if (!source) return { ok: false, cancelled: true };
  return source === 'camera' ? launchCamera() : launchLibrary();
}

export const ROSTER_CAPTURE_TIPS = [
  'Lay the roster flat and fill the frame, including column headers when possible.',
  'Use bright, even lighting and avoid glare.',
  'Capture one printed page at a time, then add the next page.',
  'Hold the phone parallel to the page to reduce skew.',
] as const;

export const MAX_ROSTER_PHOTO_PAGES = 10;
