/**
 * Shared image validation for uploads (profile pictures, logos, recruit photos).
 * Validates MIME allowlist, file size, and magic-byte signatures to prevent
 * spoofed types and non-image uploads.
 */

/** Allowed MIME types for profile and recruit images (no SVG/GIF to avoid XSS/animations). */
export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

/** Magic-byte signatures: first bytes that identify each format. */
const SIGNATURES: Record<string, (buf: ArrayBuffer) => boolean> = {
  'image/jpeg': (buf) => {
    const a = new Uint8Array(buf);
    return a.length >= 3 && a[0] === 0xff && a[1] === 0xd8 && a[2] === 0xff;
  },
  'image/jpg': (buf) => {
    const a = new Uint8Array(buf);
    return a.length >= 3 && a[0] === 0xff && a[1] === 0xd8 && a[2] === 0xff;
  },
  'image/png': (buf) => {
    const a = new Uint8Array(buf);
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return a.length >= sig.length && sig.every((b, i) => a[i] === b);
  },
  'image/webp': (buf) => {
    const a = new Uint8Array(buf);
    // RIFF....WEBP
    return (
      a.length >= 12 &&
      a[0] === 0x52 &&
      a[1] === 0x49 &&
      a[2] === 0x46 &&
      a[3] === 0x46 &&
      a[8] === 0x57 &&
      a[9] === 0x45 &&
      a[10] === 0x42 &&
      a[11] === 0x50
    );
  },
};

const MAX_HEADER_BYTES = 24;

export type ValidateImageOptions = {
  maxSizeBytes: number;
  allowedMimes?: readonly string[];
};

/**
 * Validates an image file: MIME allowlist, size, and magic-byte signature.
 * Use before uploading to Storage.
 *
 * @param file - File to validate
 * @param options - maxSizeBytes and optional allowedMimes (defaults to ALLOWED_IMAGE_MIMES)
 * @returns Error message if invalid, null if valid
 */
export async function validateImageFile(
  file: File,
  options: ValidateImageOptions
): Promise<string | null> {
  const { maxSizeBytes, allowedMimes = ALLOWED_IMAGE_MIMES } = options;

  if (file.size === 0) {
    return 'File is empty';
  }
  if (file.size > maxSizeBytes) {
    const mb = Math.round(maxSizeBytes / (1024 * 1024));
    return `Image must be less than ${mb}MB`;
  }

  const mimes = [...allowedMimes];
  if (!mimes.includes(file.type)) {
    return 'Image must be in JPG, PNG, or WebP format';
  }

  const check = SIGNATURES[file.type];
  if (!check) {
    return 'Image format not supported';
  }

  const header = await file.slice(0, MAX_HEADER_BYTES).arrayBuffer();
  if (!check(header)) {
    return 'File content does not match image type. Use a valid JPG, PNG, or WebP image.';
  }

  return null;
}
