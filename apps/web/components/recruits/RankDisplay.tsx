'use client';

/**
 * Rank Display Component
 * 
 * Displays USMC rank with badge, abbreviation, and full name.
 * Supports hover tooltip with full rank information.
 * 
 * @example
 * ```tsx
 * <RankDisplay rank="Sgt" />
 * <RankDisplay rank="Capt" size="lg" showFullName />
 * ```
 */

import React from 'react';
import { RankBadge } from './RankBadge';
import { getFullRankName, getRankMetadata } from '@/lib/utils/ranks';
import type { USMCRank } from '@/types/auth';
import { cn } from '@/lib/components/utils';

/**
 * Rank display props
 */
export interface RankDisplayProps {
  /**
   * USMC rank abbreviation
   */
  rank: USMCRank;
  /**
   * Display size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show full rank name
   * @default false
   */
  showFullName?: boolean;
  /**
   * Whether to show badge
   * @default true
   */
  showBadge?: boolean;
  /**
   * Display orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show tooltip on hover
   * @default true
   */
  showTooltip?: boolean;
}

/**
 * Rank Display Component
 */
export function RankDisplay({
  rank,
  size = 'md',
  showFullName = false,
  showBadge = true,
  orientation = 'horizontal',
  className,
  showTooltip = true,
}: RankDisplayProps): JSX.Element {
  const metadata = getRankMetadata(rank);
  const fullName = getFullRankName(rank);

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

  const content = (
    <>
      {showBadge && (
        <RankBadge
          rank={rank}
          size={size}
          interactive={showTooltip}
        />
      )}
      <div className={cn('flex flex-col', orientation === 'vertical' && 'items-center')}>
        <span className={cn('font-semibold text-text-primary-light dark:text-text-primary-dark', textSizeClasses[size])}>
          {rank}
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
        title={`${rank} - ${fullName} (${metadata.payGrade})`}
        role="tooltip"
      >
        {content}
      </div>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}
