/** Matches web `imageValidation.ts` / recruit photo limits. */
export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const IMAGE_UPLOAD_MAX_DIMENSION = 2048;
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

export type PickedImage = {
  uri: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
};

function normalizeMime(mime?: string | null): string | null {
  if (!mime) return null;
  const lower = mime.toLowerCase();
  if (lower === 'image/jpg') return 'image/jpeg';
  return lower;
}

function mimeFromUri(uri: string): string | null {
  const ext = uri.split('?')[0]?.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return null;
}

export async function resolveImageByteSize(uri: string, reportedSize?: number | null): Promise<number> {
  if (reportedSize != null && reportedSize > 0) return reportedSize;
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob.size;
}

export async function validatePickedImage(input: {
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
}): Promise<{ ok: true; image: PickedImage } | { ok: false; error: string }> {
  const mimeType = normalizeMime(input.mimeType) ?? mimeFromUri(input.uri);
  if (!mimeType || !ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return { ok: false, error: 'Use a JPG, PNG, or WebP image.' };
  }

  let fileSize: number;
  try {
    fileSize = await resolveImageByteSize(input.uri, input.fileSize);
  } catch {
    return { ok: false, error: 'Could not read the selected image.' };
  }

  if (fileSize === 0) {
    return { ok: false, error: 'The selected file is empty.' };
  }
  if (fileSize > IMAGE_UPLOAD_MAX_BYTES) {
    return { ok: false, error: 'Image must be 5MB or smaller.' };
  }

  const width = input.width ?? 0;
  const height = input.height ?? 0;
  if (width > IMAGE_UPLOAD_MAX_DIMENSION || height > IMAGE_UPLOAD_MAX_DIMENSION) {
    return {
      ok: false,
      error: `Image dimensions must be ${IMAGE_UPLOAD_MAX_DIMENSION}px or smaller on each side.`,
    };
  }

  return {
    ok: true,
    image: {
      uri: input.uri,
      mimeType,
      fileSize,
      width,
      height,
    },
  };
}

export function imageUploadHint(purpose: 'profile' | 'recruit'): string {
  if (purpose === 'profile') {
    return 'Company logo or profile photo. JPG, PNG, or WebP — max 5MB. Square images work best.';
  }
  return 'Recruit photo. JPG, PNG, or WebP — max 5MB.';
}
