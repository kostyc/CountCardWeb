'use client';

/**
 * Recruit Detail Component
 * 
 * Comprehensive detail view component for displaying recruit information,
 * status, organizational assignment, and related data.
 * 
 * @example
 * ```tsx
 * <RecruitDetail
 *   recruit={recruit}
 *   emergencyContacts={emergencyContacts}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   loading={loading}
 * />
 * ```
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner, ErrorState, EmptyState } from '@/components/feedback';
import { getFullRankName } from '@/lib/utils/ranks';
import { RankDisplay } from './RankDisplay';
import { RecruitStatus } from './RecruitStatus';
import { RecruitPhoto } from './RecruitPhoto';
import { RecruitDataExport } from './RecruitDataExport';
import type { RecruitProfile } from '@/types/models';
import type { EmergencyContact } from '@/types/models';
import type { RecruitStatus as RecruitStatusType } from '@/lib/validation/recruitSchemas';
import { formatDate, toDate } from '@/lib/utils/datetime';
import { cn } from '@/lib/components/utils';

/**
 * Recruit detail component props
 */
export interface RecruitDetailProps {
  /**
   * Recruit profile data
   */
  recruit: RecruitProfile | null;
  /**
   * Emergency contacts for the recruit
   */
  emergencyContacts?: EmergencyContact[];
  /**
   * Whether data is loading
   */
  loading?: boolean;
  /**
   * Error state
   */
  error?: Error | null;
  /**
   * Edit handler
   */
  onEdit?: () => void;
  /**
   * Delete handler
   */
  onDelete?: () => void;
  /**
   * Status change handler
   */
  onStatusChange?: (newStatus: RecruitStatusType, reason?: string) => void;
  /**
   * Whether the user can edit the status
   * @default false
   */
  canEditStatus?: boolean;
  /**
   * Whether to show edit button
   * @default true
   */
  showEditButton?: boolean;
  /**
   * Whether to show delete button
   * @default true
   */
  showDeleteButton?: boolean;
  /**
   * Recruit ID for navigation
   */
  recruitId: string;
}

/**
 * Recruit Detail Component
 * 
 * Displays comprehensive recruit information in organized sections.
 */
export function RecruitDetail({
  recruit,
  emergencyContacts = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onStatusChange,
  canEditStatus = false,
  showEditButton = true,
  showDeleteButton = true,
  recruitId,
}: RecruitDetailProps): JSX.Element {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Recruit"
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Not found state
  if (!recruit) {
    return (
      <EmptyState
        title="Recruit Not Found"
        description="The recruit you're looking for doesn't exist or has been removed."
      />
    );
  }

  // Format organizational assignment
  const organizationalPath = [
    recruit.regiment,
    recruit.battalion,
    recruit.company,
    recruit.series,
  ]
    .filter(Boolean)
    .join(' / ');

  // Convert status history from Firestore format to component format
  const statusHistory = recruit.statusHistory?.map((entry) => ({
    fromStatus: entry.fromStatus,
    toStatus: entry.toStatus,
    timestamp: entry.timestamp instanceof Date ? entry.timestamp : entry.timestamp.toDate(),
    changedBy: entry.changedBy,
    reason: entry.reason,
  })) || [];

  // Format date helper (using imported formatDate from datetime utils)
  const formatDateLocal = (date: Date | undefined) => {
    if (!date) return '—';
    return formatDate(date);
  };

  // Format address
  const formatAddress = (address: EmergencyContact['address']) => {
    if (!address) return '—';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '—';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-heading-light dark:text-text-heading-dark">
            {recruit.lastName}, {recruit.firstName}
          </h1>
          <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mt-1">
            {recruit.recruitId}
          </p>
        </div>
        <div className="flex gap-3">
          <RecruitDataExport
            recruitId={recruitId}
            recruitName={`${recruit.firstName} ${recruit.lastName}`}
            variant="secondary"
            size="md"
          />
          {showEditButton && onEdit && (
            <Button variant="primary" onClick={onEdit}>
              Edit
            </Button>
          )}
          {showDeleteButton && onDelete && (
            <Button variant="destructive" onClick={onDelete}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  First Name
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                  {recruit.firstName}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Last Name
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                  {recruit.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Rank
                </label>
                <div className="mt-1">
                  {recruit.rank ? (
                    <RankDisplay rank={recruit.rank} size="md" showFullName />
                  ) : (
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark">—</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Organizational Assignment */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
              Organizational Assignment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recruit.regiment && (
                <div>
                  <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Regiment
                  </label>
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                    {recruit.regiment}
                  </p>
                </div>
              )}
              {recruit.battalion && (
                <div>
                  <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Battalion
                  </label>
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                    {recruit.battalion}
                  </p>
                </div>
              )}
              {recruit.company && (
                <div>
                  <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Company
                  </label>
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                    {recruit.company}
                  </p>
                </div>
              )}
              {recruit.series && (
                <div>
                  <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Series
                  </label>
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                    {recruit.series}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Platoon
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                  {recruit.platoon || '—'}
                </p>
              </div>
              {organizationalPath && (
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                    Full Path
                  </label>
                  <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                    {organizationalPath}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Status Management */}
          <RecruitStatus
            currentStatus={recruit.status}
            statusHistory={statusHistory}
            onStatusChange={onStatusChange}
            canEdit={canEditStatus}
            loading={loading}
            error={error}
          />

          {/* Emergency Contacts */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Emergency Contacts
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // TODO: Navigate to add emergency contact page
                  console.log('Add emergency contact');
                }}
              >
                Add Contact
              </Button>
            </div>
            {emergencyContacts.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title="No Emergency Contacts"
                  description="No emergency contacts have been added for this recruit."
                  actionLabel="Add Contact"
                  onAction={() => {
                    // TODO: Navigate to add emergency contact page
                    console.log('Add emergency contact');
                  }}
                  size="sm"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 border border-border-primary-light dark:border-border-primary-dark rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                          {contact.lastName}, {contact.firstName}
                        </h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                          {contact.relationship}
                        </p>
                        <div className="mt-3 space-y-1">
                          <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                            <span className="font-semibold">Phone:</span> {contact.phoneNumber}
                          </p>
                          {contact.secondaryPhoneNumber && (
                            <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                              <span className="font-semibold">Secondary:</span>{' '}
                              {contact.secondaryPhoneNumber}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                              <span className="font-semibold">Email:</span> {contact.email}
                            </p>
                          )}
                          {contact.address && (
                            <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                              <span className="font-semibold">Address:</span>{' '}
                              {formatAddress(contact.address)}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          // TODO: Navigate to edit emergency contact page
                          console.log('Edit emergency contact', contact.id);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Count Card History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Count Card History
              </h2>
              <Link href={`/count-cards?recruitId=${recruitId}`}>
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            <div className="text-center py-8">
              <p className="text-text-secondary-light dark:text-text-secondary-dark">
                Count card functionality will be available in a future sprint.
              </p>
              <Link href={`/count-cards?recruitId=${recruitId}`} className="mt-4 inline-block">
                <Button variant="primary" size="sm">
                  View Count Cards
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column - Photo & Metadata */}
        <div className="space-y-6">
          {/* Photo */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
              Photo
            </h2>
            <div className="flex justify-center">
              <RecruitPhoto
                photoUrl={recruit.photoUrl}
                recruitName={`${recruit.firstName} ${recruit.lastName}`}
                size="lg"
                lazy={true}
              />
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
              Metadata
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Created
                </label>
                <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-1">
                  {formatDateLocal(toDate(recruit.createdAt))}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Last Updated
                </label>
                <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-1">
                  {formatDateLocal(toDate(recruit.updatedAt))}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
