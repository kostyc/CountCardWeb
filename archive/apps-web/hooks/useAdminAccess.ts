'use client';

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  isFullAdminUser,
  canPerformReceivingWorkflow,
  canPerformIncomingCustodyWorkflow,
} from '@countcard/core/permissions/adminAccess';

export interface UseAdminAccessResult {
  /** Unrestricted access to all features and org scopes */
  isFullAdmin: boolean;
  /** Receiving intake, checklist, transfer batch workflows */
  canReceivingWorkflow: boolean;
  /** Accept/reject incoming recruit custody at destination company */
  canIncomingCustody: boolean;
}

export function useAdminAccess(): UseAdminAccessResult {
  const { user } = useAuth();

  return useMemo(
    () => ({
      isFullAdmin: isFullAdminUser(user),
      canReceivingWorkflow: canPerformReceivingWorkflow(user),
      canIncomingCustody: canPerformIncomingCustodyWorkflow(user),
    }),
    [user]
  );
}
