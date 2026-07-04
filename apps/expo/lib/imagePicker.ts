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

async function launchLibrary(): Promise<PickImageResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Photo library access is required to choose an image.' };
  }

  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
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

async function launchCamera(): Promise<PickImageResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return { ok: false, error: 'Camera access is required to take a photo.' };
  }

  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
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

/** @deprecated Use pickValidatedImage */
export async function pickRecruitPhoto(): Promise<string | null> {
  const result = await pickValidatedImage();
  return result.ok ? result.image.uri : null;
}

/** @deprecated Use pickValidatedImage */
export async function captureRecruitPhoto(): Promise<string | null> {
  const result = await launchCamera();
  return result.ok ? result.image.uri : null;
}
