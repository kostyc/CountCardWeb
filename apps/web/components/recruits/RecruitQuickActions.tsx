'use client';

/**
 * Primary recruit actions — Import roster and Add Recruit.
 */

import { useRouter } from 'next/navigation';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/components/utils';

export interface RecruitQuickActionsProps {
  className?: string;
  /** Stack vertically on narrow viewports @default false */
  stacked?: boolean;
  /** Hide add button @default false */
  hideCreate?: boolean;
  /** Hide import button @default false */
  hideImport?: boolean;
}

export function RecruitQuickActions({
  className,
  stacked = false,
  hideCreate = false,
  hideImport = false,
}: RecruitQuickActionsProps): JSX.Element | null {
  const router = useRouter();
  const { canCreateAny } = useRecruitPermissions();

  if (!canCreateAny) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex gap-2',
        stacked ? 'flex-col sm:flex-row' : 'flex-wrap',
        className
      )}
    >
      {!hideImport && (
        <Button
          variant="secondary"
          onClick={() => router.push('/recruits/import')}
          className="min-h-[44px]"
        >
          Import roster
        </Button>
      )}
      {!hideCreate && (
        <Button
          variant="primary"
          onClick={() => router.push('/recruits/create')}
          className="min-h-[44px]"
        >
          Add Recruit
        </Button>
      )}
    </div>
  );
}
