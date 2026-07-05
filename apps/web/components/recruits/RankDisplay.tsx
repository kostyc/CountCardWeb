'use client';

/**
 * Rank Display Component
 *
 * Displays recruit pay grade (E-1–E-3) or staff USMC rank.
 */

import React from 'react';
import { RankBadge } from './RankBadge';
import {
  getFullRankName,
  getRankMetadata,
  getRecruitRankLabel,
  isRecruitRank,
} from '@/lib/utils/ranks';
import type { USMCRank } from '@/types/auth';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { cn } from '@/lib/components/utils';

export interface RankDisplayProps {
  rank: RecruitRank | USMCRank | string;
  size?: 'sm' | 'md' | 'lg';
  showFullName?: boolean;
  showBadge?: boolean;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  showTooltip?: boolean;
}

export function RankDisplay({
  rank,
  size = 'md',
  showFullName = false,
  showBadge = true,
  orientation = 'horizontal',
  className,
  showTooltip = true,
}: RankDisplayProps): JSX.Element {
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const containerClasses = cn(
    'inline-flex items-center gap-2',
    orientation === 'vertical' && 'flex-col',
    className
  );

  if (isRecruitRank(rank)) {
    const label = getRecruitRankLabel(rank);
    const content = (
      <span className={cn('font-semibold text-text-primary-light dark:text-text-primary-dark', textSizeClasses[size])}>
        {showFullName ? label : rank}
      </span>
    );

    if (showTooltip) {
      return (
        <div className={containerClasses} title={label} role="tooltip">
          {content}
        </div>
      );
    }

    return <div className={containerClasses}>{content}</div>;
  }

  const staffRank = rank as USMCRank;
  const metadata = getRankMetadata(staffRank);
  const fullName = getFullRankName(staffRank);

  const content = (
    <>
      {showBadge && <RankBadge rank={staffRank} size={size} interactive={showTooltip} />}
      <div className={cn('flex flex-col', orientation === 'vertical' && 'items-center')}>
        <span className={cn('font-semibold text-text-primary-light dark:text-text-primary-dark', textSizeClasses[size])}>
          {staffRank}
        </span>
        {showFullName && (
          <span className={cn('text-text-secondary-light dark:text-text-secondary-dark', size === 'sm' ? 'text-xs' : 'text-sm')}>
            {fullName}
          </span>
        )}
      </div>
    </>
  );

  if (showTooltip) {
    return (
      <div
        className={containerClasses}
        title={`${staffRank} - ${fullName} (${metadata.payGrade})`}
        role="tooltip"
      >
        {content}
      </div>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}
