'use client';

/**
 * Emergency Contact Form Modal
 *
 * Modal form for adding or editing an emergency contact. Uses Zod validation
 * and emits submit/cancel for the parent to perform Firestore operations.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import {
  emergencyContactInputSchema,
  contactRelationshipSchema,
  contactMethodSchema,
} from '@/lib/validation/emergencyContactSchemas';
import type { EmergencyContact } from '@/types/models';
import type { z } from 'zod';

type ContactRelationshipKey = z.infer<typeof contactRelationshipSchema>;
type ContactMethodKey = z.infer<typeof contactMethodSchema>;

const RELATIONSHIP_OPTIONS: { value: ContactRelationshipKey; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
  { value: 'emergency_contact', label: 'Emergency Contact' },
];

const CONTACT_METHOD_OPTIONS: { value: ContactMethodKey; label: string }[] = [
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
];

export interface EmergencyContactFormValues {
  firstName: string;
  lastName: string;
  relationship: ContactRelationshipKey;
  phoneNumber: string;
  secondaryPhoneNumber: string;
  email: string;
  preferredContactMethod: ContactMethodKey | '';
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
}

const emptyFormValues: EmergencyContactFormValues = {
  firstName: '',
  lastName: '',
  relationship: 'parent',
  phoneNumber: '',
  secondaryPhoneNumber: '',
  email: '',
  preferredContactMethod: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  notes: '',
};

export interface EmergencyContactFormModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  recruitId: string;
  initialContact?: EmergencyContact | null;
  onClose: () => void;
  onSubmit: (data: EmergencyContactFormValues) => void | Promise<void>;
  loading?: boolean;
}

export function EmergencyContactFormModal({
  open,
  mode,
  recruitId,
  initialContact,
  onClose,
  onSubmit,
  loading = false,
}: EmergencyContactFormModalProps): JSX.Element | null {
  const [values, setValues] = useState<EmergencyContactFormValues>(emptyFormValues);
  const [errors, setErrors] = useState<Partial<Record<keyof EmergencyContactFormValues, string>>>({});

  useEffect(() => {
    if (!open) {
      setValues(emptyFormValues);
      setErrors({});
      return;
    }
    if (mode === 'edit' && initialContact) {
      setValues({
        firstName: initialContact.firstName ?? '',
        lastName: initialContact.lastName ?? '',
        relationship: (initialContact.relationship as ContactRelationshipKey) ?? 'parent',
        phoneNumber: initialContact.phoneNumber ?? '',
        secondaryPhoneNumber: initialContact.secondaryPhoneNumber ?? '',
        email: initialContact.email ?? '',
        preferredContactMethod: (initialContact.preferredContactMethod as ContactMethodKey) ?? '',
        street: initialContact.address?.street ?? '',
        city: initialContact.address?.city ?? '',
        state: initialContact.address?.state ?? '',
        zipCode: initialContact.address?.zipCode ?? '',
        country: initialContact.address?.country ?? '',
        notes: initialContact.notes ?? '',
      });
    } else {
      setValues(emptyFormValues);
    }
    setErrors({});
  }, [open, mode, initialContact, recruitId]);

  const handleChange = (field: keyof EmergencyContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const getPayloadForValidation = () => {
    const address =
      values.street || values.city || values.state || values.zipCode || values.country
        ? {
            street: values.street || undefined,
            city: values.city || undefined,
            state: values.state || undefined,
            zipCode: values.zipCode || undefined,
            country: values.country || undefined,
          }
        : undefined;
    return {
      emergencyContactId: mode === 'edit' && initialContact ? initialContact.id : 'pending',
      recruitId,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      relationship: values.relationship,
      phoneNumber: values.phoneNumber.trim(),
      secondaryPhoneNumber: values.secondaryPhoneNumber.trim() || undefined,
      email: values.email.trim() || undefined,
      preferredContactMethod: values.preferredContactMethod || undefined,
      address,
      notes: values.notes.trim() || undefined,
      createdBy: 'current-user',
      updatedBy: 'current-user',
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = getPayloadForValidation();
    const parseResult = emergencyContactInputSchema.safeParse(payload);
    if (!parseResult.success) {
      const fieldErrors: Partial<Record<keyof EmergencyContactFormValues, string>> = {};
      const flat = parseResult.error.flatten();
      if (flat.fieldErrors) {
        Object.entries(flat.fieldErrors).forEach(([key, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;
          if (msg && key in emptyFormValues)
            fieldErrors[key as keyof EmergencyContactFormValues] = msg;
        });
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(values);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-contact-modal-title"
    >
      <div
        className="bg-background-primary-light dark:bg-background-primary-dark rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2
            id="emergency-contact-modal-title"
            className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-4"
          >
            {mode === 'add' ? 'Add Emergency Contact' : 'Edit Emergency Contact'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                required
                value={values.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                errorText={errors.firstName}
                placeholder="First name"
              />
              <Input
                label="Last name"
                required
                value={values.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                errorText={errors.lastName}
                placeholder="Last name"
              />
            </div>
            <Select
              label="Relationship"
              required
              options={RELATIONSHIP_OPTIONS}
              value={values.relationship}
              onChange={(e) => handleChange('relationship', e.target.value as ContactRelationshipKey)}
              errorText={errors.relationship}
            />
            <Input
              label="Phone number"
              type="tel"
              required
              value={values.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              errorText={errors.phoneNumber}
              placeholder="Phone number"
            />
            <Input
              label="Secondary phone (optional)"
              type="tel"
              value={values.secondaryPhoneNumber}
              onChange={(e) => handleChange('secondaryPhoneNumber', e.target.value)}
              errorText={errors.secondaryPhoneNumber}
              placeholder="Secondary phone"
            />
            <Input
              label="Email (optional)"
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              errorText={errors.email}
              placeholder="Email"
            />
            <Select
              label="Preferred contact method (optional)"
              options={[{ value: '', label: '—' }, ...CONTACT_METHOD_OPTIONS]}
              value={values.preferredContactMethod}
              onChange={(e) =>
                handleChange('preferredContactMethod', e.target.value as ContactMethodKey)
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Street (optional)"
                value={values.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Street"
              />
              <Input
                label="City (optional)"
                value={values.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="State (optional)"
                value={values.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
              />
              <Input
                label="ZIP (optional)"
                value={values.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                placeholder="12345"
              />
            </div>
            <Input
              label="Country (optional)"
              value={values.country}
              onChange={(e) => handleChange('country', e.target.value)}
              placeholder="Country"
            />
            <Input
              label="Notes (optional)"
              value={values.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Notes"
            />
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : mode === 'add' ? 'Add Contact' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
