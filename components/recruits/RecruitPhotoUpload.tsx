'use client';

/**
 * Recruit Photo Upload Component
 * 
 * Component for uploading recruit photos with preview, validation, and progress tracking.
 * 
 * @example
 * ```tsx
 * <RecruitPhotoUpload
 *   recruitId={recruitId}
 *   currentPhotoUrl={recruit.photoUrl}
 *   onUploadComplete={(url) => setPhotoUrl(url)}
 *   onError={(error) => setError(error)}
 * />
 * ```
 */

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/feedback';
import { uploadRecruitPhoto, validateImageFile, replaceRecruitPhoto } from '@/lib/storage/recruitPhoto';
import { cn } from '@/lib/components/utils';

/**
 * Recruit Photo Upload component props
 */
export interface RecruitPhotoUploadProps {
  /**
   * Recruit ID
   */
  recruitId: string;
  /**
   * Current photo URL (if any)
   */
  currentPhotoUrl?: string;
  /**
   * Callback when upload completes
   */
  onUploadComplete?: (photoUrl: string) => void;
  /**
   * Callback when upload fails
   */
  onError?: (error: Error) => void;
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Recruit Photo Upload Component
 * 
 * Provides file input, preview, validation, and upload functionality for recruit photos.
 */
export function RecruitPhotoUpload({
  recruitId,
  currentPhotoUrl,
  onUploadComplete,
  onError,
  disabled = false,
  className,
}: RecruitPhotoUploadProps): JSX.Element {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // Clear previous errors
    setError(null);
    setValidationError(null);

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setValidationError(validationError);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Set selected file
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Handle file upload
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Upload photo with progress tracking
      const photoUrl = await uploadRecruitPhoto(recruitId, selectedFile, {
        resize: false, // Resizing not yet implemented
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      // Replace old photo if exists
      if (currentPhotoUrl && currentPhotoUrl !== photoUrl) {
        await replaceRecruitPhoto(recruitId, currentPhotoUrl, photoUrl);
      }

      // Call success callback
      onUploadComplete?.(photoUrl);

      // Reset state
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload photo');
      setError(error.message);
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle remove photo
   */
  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(currentPhotoUrl || null);
    setError(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle trigger file input
   */
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recruit Photo</h3>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-border-secondary-light dark:border-border-secondary-dark">
                <Image
                  src={preview}
                  alt="Recruit photo preview"
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
            ) : (
              <div className="w-48 h-48 rounded-lg border-2 border-dashed border-border-secondary-light dark:border-border-secondary-dark flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                  No photo selected
                </p>
              </div>
            )}

            {/* File Input (Hidden) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={disabled || uploading}
              className="hidden"
              aria-label="Select recruit photo"
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleTriggerFileInput}
                disabled={disabled || uploading}
              >
                {currentPhotoUrl ? 'Change Photo' : 'Select Photo'}
              </Button>

              {selectedFile && (
                <>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleUpload}
                    disabled={disabled || uploading}
                    loading={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleRemove}
                    disabled={disabled || uploading}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  Uploading...
                </span>
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
              role="alert"
            >
              <p className="text-sm text-red-800 dark:text-red-200">
                {validationError}
              </p>
            </div>
          )}

          {/* Upload Error */}
          {error && (
            <div
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
              role="alert"
            >
              <p className="text-sm text-red-800 dark:text-red-200">
                {error}
              </p>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Supported formats: JPG, PNG, WebP. Maximum file size: 5MB.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
