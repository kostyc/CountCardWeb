import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { validatePickedImage, type PickedImage } from '@/lib/imageValidation';

export type PickImageResult =
  | { ok: true; image: PickedImage }
  | { ok: false; error?: string; cancelled?: boolean };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
  exif: false,
};

/** 3×5 index-card proportions (width:height). */
const DI_CARD_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [3, 5],
  quality: 0.9,
  exif: false,
};

async function launchLibrary(
  options: ImagePicker.ImagePickerOptions = PICKER_OPTIONS
): Promise<PickImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Photo library access is required to choose an image.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  return validatePickedImage({
    uri: asset.uri,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    width: asset.width,
    height: asset.height,
  });
}

async function launchCamera(
  options: ImagePicker.ImagePickerOptions = PICKER_OPTIONS
): Promise<PickImageResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Camera access is required to take a photo.' };
  }

  const result = await ImagePicker.launchCameraAsync(options);
  if (result.canceled || !result.assets[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  return validatePickedImage({
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
    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Photo library', onPress: () => resolve('library') },
      { text: 'Take photo', onPress: () => resolve('camera') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}

/** Pick from camera or photo library with size/format validation. */
export async function pickValidatedImage(): Promise<PickImageResult> {
  const source = await pickSource();
  if (!source) return { ok: false, cancelled: true };
  return source === 'camera' ? launchCamera() : launchLibrary();
}

/** Pick a 3×5 DI leadership card photo (portrait index-card crop). */
export async function pickDiCardImage(): Promise<PickImageResult> {
  const source = await pickSource();
  if (!source) return { ok: false, cancelled: true };
  return source === 'camera'
    ? launchCamera(DI_CARD_PICKER_OPTIONS)
    : launchLibrary(DI_CARD_PICKER_OPTIONS);
}
