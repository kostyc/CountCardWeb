'use client';

/**
 * Recruit Photo Display Component
 * 
 * Component for displaying recruit photos with fallback to placeholder.
 * Supports responsive sizing and lazy loading.
 * 
 * @example
 * ```tsx
 * <RecruitPhoto
 *   photoUrl={recruit.photoUrl}
 *   recruitName={`${recruit.firstName} ${recruit.lastName}`}
 *   size="lg"
 * />
 * ```
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/components/utils';

/**
 * Photo size options
 */
export type PhotoSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Recruit Photo component props
 */
export interface RecruitPhotoProps {
  /**
   * Photo URL
   */
  photoUrl?: string;
  /**
   * Recruit name (for alt text and placeholder)
   */
  recruitName?: string;
  /**
   * Photo size
   * @default 'md'
   */
  size?: PhotoSize;
  /**
   * Whether to use lazy loading
   * @default true
   */
  lazy?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * Size configuration
 */
const SIZE_CONFIG: Record<PhotoSize, { width: number; height: number; classes: string }> = {
  sm: {
    width: 64,
    height: 64,
    classes: 'w-16 h-16',
  },
  md: {
    width: 128,
    height: 128,
    classes: 'w-32 h-32',
  },
  lg: {
    width: 192,
    height: 192,
    classes: 'w-48 h-48',
  },
  xl: {
    width: 256,
    height: 256,
    classes: 'w-64 h-64',
  },
};

/**
 * Default placeholder SVG
 */
const PlaceholderIcon = ({ size }: { size: PhotoSize }) => {
  const iconSize = SIZE_CONFIG[size].width;
  return (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-400"
    >
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * Recruit Photo Component
 * 
 * Displays recruit photo with fallback to placeholder.
 */
export function RecruitPhoto({
  photoUrl,
  recruitName = 'Recruit',
  size = 'md',
  lazy = true,
  className,
  onClick,
}: RecruitPhotoProps): JSX.Element {
  const sizeConfig = SIZE_CONFIG[size];
  const hasPhoto = !!photoUrl;

  // Generate initials for placeholder
  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(recruitName);

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden',
        'border-2 border-border-secondary-light dark:border-border-secondary-dark',
        'bg-gray-100 dark:bg-gray-800',
        'flex items-center justify-center',
        sizeConfig.classes,
        onClick && 'cursor-pointer hover:opacity-90 transition-opacity',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `View photo for ${recruitName}` : `Photo of ${recruitName}`}
    >
      {hasPhoto ? (
        <Image
          src={photoUrl}
          alt={`Photo of ${recruitName}`}
          fill
          className="object-cover"
          sizes={`${sizeConfig.width}px`}
          loading={lazy ? 'lazy' : 'eager'}
          onError={(e) => {
            // Fallback to placeholder on error
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full">
          <PlaceholderIcon size={size} />
          {size !== 'sm' && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
              {initials}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
