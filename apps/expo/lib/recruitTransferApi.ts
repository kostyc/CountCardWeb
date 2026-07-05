import { getApiBaseUrl, transferRecruitViaApi, type RecruitTransferAssignment } from '@countcard/api-client';
import { transferRecruitProfile } from '@countcard/firebase/services/recruits';

function shouldFallbackToClientTransfer(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('(404)') ||
    message.includes('could not reach the countcard api') ||
    message.includes('network request failed')
  );
}

export async function transferRecruit(
  recruitId: string,
  assignment: RecruitTransferAssignment,
  transferredBy: string,
  reason?: string
): Promise<void> {
  if (getApiBaseUrl()) {
    try {
      await transferRecruitViaApi(recruitId, assignment, reason);
      return;
    } catch (error) {
      if (!shouldFallbackToClientTransfer(error)) {
        throw error;
      }
    }
  }

  await transferRecruitProfile(recruitId, assignment, transferredBy, reason);
}
