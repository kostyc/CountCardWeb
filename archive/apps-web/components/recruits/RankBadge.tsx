'use client';

/**
 * Rank Badge Component
 * 
 * Visual representation of USMC rank using SVG badges/insignia.
 * Displays rank insignia appropriate for each rank level.
 * 
 * @example
 * ```tsx
 * <RankBadge rank="Sgt" size="md" />
 * <RankBadge rank="Capt" size="lg" showLabel />
 * ```
 */

import React from 'react';
import { getRankMetadata, type RankMetadata } from '@/lib/utils/ranks';
import type { USMCRank } from '@/types/auth';
import { cn } from '@/lib/components/utils';

/**
 * Rank badge props
 */
export interface RankBadgeProps {
  /**
   * USMC rank abbreviation
   */
  rank: USMCRank;
  /**
   * Badge size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show rank label below badge
   * @default false
   */
  showLabel?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether badge is interactive (hover tooltip)
   * @default false
   */
  interactive?: boolean;
}

/**
 * Size configurations
 */
const SIZE_CONFIG = {
  sm: {
    badge: 'w-8 h-8',
    text: 'text-xs',
    chevron: 2,
  },
  md: {
    badge: 'w-12 h-12',
    text: 'text-sm',
    chevron: 3,
  },
  lg: {
    badge: 'w-16 h-16',
    text: 'text-base',
    chevron: 4,
  },
};

/**
 * Render enlisted rank badge (chevrons)
 */
function renderEnlistedBadge(rank: USMCRank, metadata: RankMetadata, size: 'sm' | 'md' | 'lg'): JSX.Element {
  const { payGrade } = metadata;
  const badgeSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
  const viewBox = '0 0 64 64';

  // E-5: 3 chevrons (Sergeant)
  // E-6: 3 chevrons + 1 rocker (Staff Sergeant)
  // E-7: 3 chevrons + 2 rockers (Gunnery Sergeant)
  // E-8: 3 chevrons + 3 rockers (Master Sergeant/First Sergeant)
  // E-9: 3 chevrons + 4 rockers + special insignia (varies by specific rank)

  const getRockerCount = () => {
    switch (payGrade) {
      case 'E-5':
        return 0;
      case 'E-6':
        return 1;
      case 'E-7':
        return 2;
      case 'E-8':
        return 3;
      case 'E-9':
        return 4;
      default:
        return 0;
    }
  };

  const rockers = getRockerCount();

  return (
    <svg
      width={badgeSize}
      height={badgeSize}
      viewBox={viewBox}
      className="text-marine-red"
      fill="currentColor"
      aria-label={`${metadata.fullName} badge`}
    >
      {/* Three chevrons (standard for all enlisted E-5+) */}
      <path d="M20 20 L32 30 L44 20 L40 20 L32 26 L24 20 Z" fill="currentColor" />
      <path d="M24 24 L32 30 L40 24 L36 24 L32 28 L28 24 Z" fill="currentColor" />
      <path d="M28 28 L32 30 L36 28 Z" fill="currentColor" />
      
      {/* Rockers (curved lines below chevrons) */}
      {rockers > 0 && (
        <>
          {Array.from({ length: rockers }).map((_, i) => {
            const y = 38 + i * 4;
            const radius = 20 - i * 2;
            return (
              <path
                key={`rocker-${i}`}
                d={`M${32 - radius} ${y} A${radius} ${radius / 2} 0 0 1 ${32 + radius} ${y}`}
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              />
            );
          })}
        </>
      )}

      {/* Special insignia for E-9 ranks */}
      {rank === 'SgtMaj' && (
        <circle cx="32" cy="52" r="3" fill="currentColor" />
      )}
      {rank === 'MGySgt' && (
        <path
          d="M28 50 L32 54 L36 50"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      )}
      {rank === 'SgtMajMC' && (
        <>
          <circle cx="32" cy="50" r="3" fill="currentColor" />
          <path
            d="M24 56 L32 60 L40 56"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Render officer rank badge (bars/oak leaves/eagle)
 */
function renderOfficerBadge(rank: USMCRank, metadata: RankMetadata, size: 'sm' | 'md' | 'lg'): JSX.Element {
  const { payGrade } = metadata;
  const badgeSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
  const viewBox = '0 0 64 64';

  // O-1: 1 gold bar (Second Lieutenant)
  // O-2: 1 silver bar (First Lieutenant)
  // O-3: 2 silver bars (Captain)
  // O-4: 1 gold oak leaf (Major)
  // O-5: 1 silver oak leaf (Lieutenant Colonel)
  // O-6: 1 silver eagle (Colonel)

  return (
    <svg
      width={badgeSize}
      height={badgeSize}
      viewBox={viewBox}
      className="text-yellow-600 dark:text-yellow-500"
      fill="currentColor"
      aria-label={`${metadata.fullName} badge`}
    >
      {/* Bars for O-1 through O-3 */}
      {payGrade === 'O-1' && (
        <rect x="16" y="28" width="32" height="6" rx="1" fill="currentColor" />
      )}
      {payGrade === 'O-2' && (
        <rect x="16" y="28" width="32" height="6" rx="1" fill="currentColor" />
      )}
      {payGrade === 'O-3' && (
        <>
          <rect x="16" y="24" width="32" height="6" rx="1" fill="currentColor" />
          <rect x="16" y="34" width="32" height="6" rx="1" fill="currentColor" />
        </>
      )}

      {/* Oak leaf for O-4 and O-5 */}
      {(payGrade === 'O-4' || payGrade === 'O-5') && (
        <path
          d="M32 18 L26 28 L28 36 L32 42 L36 36 L38 28 Z M32 18 L30 24 L32 28 L34 24 Z"
          fill="currentColor"
        />
      )}

      {/* Eagle for O-6 */}
      {payGrade === 'O-6' && (
        <path
          d="M32 12 L28 20 L30 28 L32 32 L34 28 L36 20 Z M32 32 L28 40 L32 44 L36 40 Z M32 44 L30 48 L32 50 L34 48 Z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

/**
 * Rank Badge Component
 */
export function RankBadge({
  rank,
  size = 'md',
  showLabel = false,
  className,
  interactive = false,
}: RankBadgeProps): JSX.Element {
  const metadata = getRankMetadata(rank);
  const sizeConfig = SIZE_CONFIG[size];

  const badgeElement = metadata.type === 'enlisted' 
    ? renderEnlistedBadge(rank, metadata, size)
    : renderOfficerBadge(rank, metadata, size);

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center',
        interactive && 'cursor-help',
        className
      )}
      title={interactive ? metadata.fullName : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className={cn('flex items-center justify-center', sizeConfig.badge)}>
        {badgeElement}
      </div>
      {showLabel && (
        <span className={cn('mt-1 font-semibold text-text-primary-light dark:text-text-primary-dark', sizeConfig.text)}>
          {rank}
        </span>
      )}
    </div>
  );
}
