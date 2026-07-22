import { ZodError } from 'zod';
import { ServiceError } from '@countcard/firebase/services/base';

export function formatMcrdSaveError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues
      .map((issue) => {
        const path = issue.path.length ? issue.path.join('.') : 'form';
        return `${path}: ${issue.message}`;
      })
      .slice(0, 5)
      .join('\n');
  }

  if (error instanceof ServiceError) {
    if (error.code === 'permission-denied') {
      return [
        'Firestore permission denied.',
        'An admin must deploy rules from the repo root:',
        'firebase deploy --only firestore:rules',
      ].join('\n');
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Save failed';
}
