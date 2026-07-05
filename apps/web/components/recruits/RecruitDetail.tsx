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
 *   onModify={handleModify}
 *   onTransfer={handleTransfer}
 *   onDelete={handleDelete}
 *   loading={loading}
 * />
 * ```
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner, ErrorState, EmptyState } from '@/components/feedback';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { getFullRankName } from '@/lib/utils/ranks';
import { RankDisplay } from './RankDisplay';
import { RecruitStatus } from './RecruitStatus';
import { RecruitPhoto } from './RecruitPhoto';
import { RecruitDataExport } from './RecruitDataExport';
import { EmergencyContactFormModal, type EmergencyContactFormValues } from './EmergencyContactFormModal';
import type { RecruitProfile } from '@/types/models';
import type { EmergencyContact } from '@/types/models';
import type { RecruitStatus as RecruitStatusType } from '@/lib/validation/recruitSchemas';
import { formatDate, toDate } from '@/lib/utils/datetime';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { getBattalionLogoPath } from '@/lib/constants/organizations';
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
   * Modify handler
   */
  onModify?: () => void;
  /**
   * Transfer handler
   */
  onTransfer?: () => void;
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
   * Whether to show modify button
   * @default true
   */
  showModifyButton?: boolean;
  /**
   * Whether to show transfer button
   * @default true
   */
  showTransferButton?: boolean;
  /**
   * Whether to show delete button
   * @default true
   */
  showDeleteButton?: boolean;
  /**
   * Recruit ID for navigation
   */
  recruitId: string;
  /** Whether the user can edit emergency contacts (add/edit/delete) */
  canEditContacts?: boolean;
  /** Emergency contact modal: visible */
  showContactModal?: boolean;
  /** Emergency contact modal: 'add' | 'edit' */
  contactModalMode?: 'add' | 'edit';
  /** Emergency contact being edited (for edit mode) */
  editingContact?: EmergencyContact | null;
  /** Close contact modal */
  onCloseContactModal?: () => void;
  /** Open add contact modal */
  onOpenAddContact?: () => void;
  /** Open edit contact modal */
  onOpenEditContact?: (contact: EmergencyContact) => void;
  /** Submit add contact (form values) */
  onAddContact?: (data: EmergencyContactFormValues) => void | Promise<void>;
  /** Submit edit contact (contact id, form values) */
  onEditContact?: (contactId: string, data: EmergencyContactFormValues) => void | Promise<void>;
  /** Delete contact (contact id) */
  onDeleteContact?: (contactId: string) => void | Promise<void>;
  /** Contact form submitting */
  contactFormLoading?: boolean;
  /** Whether the viewer can see full profile (including extended info) per recruit privacy */
  canSeeFullProfile?: boolean;
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
  onModify,
  onTransfer,
  onDelete,
  onStatusChange,
  canEditStatus = false,
  showModifyButton = true,
  showTransferButton = true,
  showDeleteButton = true,
  recruitId,
  canEditContacts = false,
  showContactModal = false,
  contactModalMode = 'add',
  editingContact = null,
  onCloseContactModal,
  onOpenAddContact,
  onOpenEditContact,
  onAddContact,
  onEditContact,
  onDeleteContact,
  contactFormLoading = false,
  canSeeFullProfile = true,
}: RecruitDetailProps): JSX.Element {
  const [contactSearch, setContactSearch] = useState('');
  const [contactRelationshipFilter, setContactRelationshipFilter] = useState<string>('');
  const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null);

  const filteredContacts = useMemo(() => {
    let list = emergencyContacts;
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.firstName?.toLowerCase().includes(q) ||
          c.lastName?.toLowerCase().includes(q) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          `${c.lastName} ${c.firstName}`.toLowerCase().includes(q)
      );
    }
    if (contactRelationshipFilter) {
      list = list.filter((c) => c.relationship === contactRelationshipFilter);
    }
    return list;
  }, [emergencyContacts, contactSearch, contactRelationshipFilter]);

  const relationshipOptions = useMemo(() => {
    const set = new Set(emergencyContacts.map((c) => c.relationship).filter(Boolean));
    return [
      { value: '', label: 'All relationships' },
      ...Array.from(set).map((r) => ({ value: r, label: r.replace(/_/g, ' ') })),
    ];
  }, [emergencyContacts]);
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
            EDIPI: {formatEdipiForDisplay(recruit)}
          </p>
        </div>
        <div className="flex gap-3">
          <RecruitDataExport
            recruitId={recruitId}
            recruitName={`${recruit.firstName} ${recruit.lastName}`}
            variant="secondary"
            size="md"
          />
          {showModifyButton && onModify && (
            <Button variant="primary" onClick={onModify}>
              Modify Recruit
            </Button>
          )}
          {showTransferButton && onTransfer && (
            <Button variant="secondary" onClick={onTransfer}>
              Transfer Recruit
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
                  EDIPI
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1 font-mono">
                  {formatEdipiForDisplay(recruit) || '—'}
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

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
              Equipment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  Weapons serial number
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                  {recruit.weaponsSerialNumber || '—'}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                  RCO serial number
                </label>
                <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                  {recruit.rcoSerialNumber || '—'}
                </p>
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
                  <div className="flex items-center gap-3 mt-1">
                    {getBattalionLogoPath(recruit.battalion) && (
                      <Image
                        src={getBattalionLogoPath(recruit.battalion)!}
                        alt=""
                        width={48}
                        height={48}
                        className="rounded object-contain flex-shrink-0"
                        unoptimized
                      />
                    )}
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                      {recruit.battalion}
                    </p>
                  </div>
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

          {/* Extended Information */}
          {canSeeFullProfile &&
            (recruit.medicalNotes ||
              recruit.dietaryRestrictions ||
              recruit.preferredContactMethod ||
              recruit.extendedNotes ||
              (recruit.encryptedData &&
                typeof (recruit.encryptedData as Record<string, unknown>).ciphertext === 'string')) && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4 flex items-center gap-2">
                Extended Information
                {recruit.encryptedData &&
                  typeof (recruit.encryptedData as Record<string, unknown>).ciphertext === 'string' && (
                    <span
                      className="text-xs font-normal text-text-secondary-light dark:text-text-secondary-dark inline-flex items-center gap-1"
                      title="Sensitive fields are encrypted at rest"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Encrypted
                    </span>
                  )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recruit.medicalNotes && (
                  <div>
                    <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Medical notes
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1 whitespace-pre-wrap">
                      {recruit.medicalNotes}
                    </p>
                  </div>
                )}
                {recruit.dietaryRestrictions && (
                  <div>
                    <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Dietary restrictions
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                      {recruit.dietaryRestrictions}
                    </p>
                  </div>
                )}
                {recruit.preferredContactMethod && (
                  <div>
                    <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Preferred contact method
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1">
                      {recruit.preferredContactMethod === 'phone' ? 'Phone' : 'Email'}
                    </p>
                  </div>
                )}
                {recruit.extendedNotes && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Notes
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark mt-1 whitespace-pre-wrap">
                      {recruit.extendedNotes}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Emergency Contacts */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Emergency Contacts
              </h2>
              {canEditContacts && (onOpenAddContact || onOpenEditContact) && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={onOpenAddContact}
                >
                  Add Contact
                </Button>
              )}
            </div>
            {emergencyContacts.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <Input
                    type="search"
                    placeholder="Search by name"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    fullWidth
                  />
                </div>
                <div className="min-w-[180px]">
                  <Select
                    options={relationshipOptions}
                    value={contactRelationshipFilter}
                    onChange={(e) => setContactRelationshipFilter(e.target.value)}
                  />
                </div>
              </div>
            )}
            {filteredContacts.length === 0 ? (
              <div className="py-8">
                <EmptyState
                  title={emergencyContacts.length === 0 ? 'No Emergency Contacts' : 'No matches'}
                  description={
                    emergencyContacts.length === 0
                      ? 'No emergency contacts have been added for this recruit.'
                      : 'Try a different search or filter.'
                  }
                  actionLabel={canEditContacts ? 'Add Contact' : undefined}
                  onAction={canEditContacts ? onOpenAddContact : undefined}
                  size="sm"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 border border-border-primary-light dark:border-border-primary-dark rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
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
                      {canEditContacts && (onOpenEditContact || onDeleteContact) && (
                        <div className="flex gap-2 flex-shrink-0">
                          {onOpenEditContact && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="min-h-[44px] min-w-[44px]"
                              onClick={() => onOpenEditContact(contact)}
                              aria-label={`Edit ${contact.firstName} ${contact.lastName}`}
                            >
                              Edit
                            </Button>
                          )}
                          {onDeleteContact && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="min-h-[44px] min-w-[44px]"
                              onClick={() => setContactToDelete(contact)}
                              aria-label={`Delete ${contact.firstName} ${contact.lastName}`}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Emergency contact form modal */}
          {showContactModal && onCloseContactModal && onAddContact && onEditContact && (
            <EmergencyContactFormModal
              open={showContactModal}
              mode={contactModalMode}
              recruitId={recruitId}
              initialContact={contactModalMode === 'edit' ? editingContact ?? undefined : undefined}
              onClose={onCloseContactModal}
              onSubmit={
                contactModalMode === 'add'
                  ? onAddContact
                  : async (data) => {
                      if (editingContact) {
                        await onEditContact(editingContact.id, data);
                      }
                    }
              }
              loading={contactFormLoading}
            />
          )}

          {/* Delete contact confirmation */}
          {contactToDelete && onDeleteContact && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-contact-title"
            >
              <div className="bg-background-primary-light dark:bg-background-primary-dark rounded-xl shadow-xl p-6 max-w-md w-full">
                <h3
                  id="delete-contact-title"
                  className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-2"
                >
                  Delete emergency contact?
                </h3>
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                  This will remove{' '}
                  <strong>
                    {contactToDelete.firstName} {contactToDelete.lastName}
                  </strong>{' '}
                  as an emergency contact. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => setContactToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await onDeleteContact(contactToDelete.id);
                      setContactToDelete(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

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
