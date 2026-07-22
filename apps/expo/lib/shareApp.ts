import { Platform, Share } from 'react-native';
import { APP_SHARE_URL } from '@/constants/appVersion';

export function getAppShareUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return APP_SHARE_URL;
}

export async function shareCountCardApp(): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const url = getAppShareUrl();
  const message =
    'CountCard — Marine Corps recruit accountability. Track recruits, count cards, receiving intake, and unit workflows.';

  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'CountCard', text: message, url });
        return 'shared';
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${message}\n${url}`);
        return 'copied';
      }
      return 'failed';
    }

    const result = await Share.share({
      title: 'CountCard',
      message: `${message}\n${url}`,
      url,
    });

    return result.action === Share.sharedAction ? 'shared' : 'cancelled';
  } catch {
    return 'failed';
  }
}
