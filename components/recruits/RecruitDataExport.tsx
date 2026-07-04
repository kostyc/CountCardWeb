'use client';

/**
 * Recruit Data Export Component
 * 
 * Component for exporting recruit data in GDPR-compliant format.
 * Provides export button, confirmation dialog, and download functionality.
 * 
 * @example
 * ```tsx
 * <RecruitDataExport
 *   recruitId="recruit-123"
 *   recruitName="John Doe"
 *   onExportComplete={handleExportComplete}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/forms/Select';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { logError, logInfo } from '@/lib/utils/logger';

export type ExportFormatOption = 'json' | 'csv' | 'pdf';

const FORMAT_OPTIONS: { value: ExportFormatOption; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'pdf', label: 'PDF' },
];

/**
 * Recruit data export component props
 */
export interface RecruitDataExportProps {
  /**
   * Recruit ID to export
   */
  recruitId: string;
  /**
   * Recruit name for display
   */
  recruitName?: string;
  /**
   * Callback when export completes successfully
   */
  onExportComplete?: () => void;
  /**
   * Whether to show as icon button
   * @default false
   */
  iconOnly?: boolean;
  /**
   * Button variant
   * @default "secondary"
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /**
   * Button size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Recruit Data Export Component
 * 
 * Handles export functionality with confirmation dialog and download.
 */
export function RecruitDataExport({
  recruitId,
  recruitName,
  onExportComplete,
  iconOnly = false,
  variant = 'secondary',
  size = 'md',
  className,
}: RecruitDataExportProps): JSX.Element {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatOption>('json');

  const handleExportClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmExport = async () => {
    if (!user) {
      showToast({
        variant: 'error',
        message: 'You must be logged in to export data.',
      });
      return;
    }

    setShowConfirmDialog(false);
    setExporting(true);

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      const response = await fetch(
        `/api/recruits/${recruitId}/export?format=${selectedFormat}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Export failed: ${response.statusText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `recruit-${recruitId}-export-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      if (selectedFormat === 'json') {
        const exportData = await response.json();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        downloadBlob(blob, filename);
      } else if (selectedFormat === 'csv') {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv; charset=utf-8' });
        downloadBlob(blob, filename);
      } else {
        const buffer = await response.arrayBuffer();
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadBlob(blob, filename);
      }

      logInfo(`Recruit data exported: ${recruitId} (${selectedFormat})`, 'RecruitDataExport');

      showToast({
        variant: 'success',
        message: 'Recruit data exported successfully.',
      });

      onExportComplete?.();
    } catch (error) {
      logError(error as Error, 'RecruitDataExport.export');
      showToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to export recruit data. Please try again.',
      });
    } finally {
      setExporting(false);
    }
  };

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const handleCancelExport = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button
        onClick={handleExportClick}
        variant={variant === 'outline' ? 'secondary' : variant}
        size={size}
        disabled={exporting || !user}
        className={className}
        aria-label={iconOnly ? 'Export recruit data' : undefined}
      >
        {exporting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              width="16"
              height="16"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Exporting...
          </>
        ) : iconOnly ? (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        ) : (
          <>
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Data
          </>
        )}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCancelExport}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-dialog-title"
          aria-describedby="export-dialog-description"
        >
          <div
            className="bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="export-dialog-title"
              className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2"
            >
              Export Recruit Data
            </h3>
            <p
              id="export-dialog-description"
              className="text-text-secondary-light dark:text-text-secondary-dark mb-4"
            >
              {recruitName ? (
                <>
                  Export all data for <strong>{recruitName}</strong> in GDPR-compliant format.
                  Includes recruit profile, emergency contacts, and related information.
                </>
              ) : (
                <>
                  Export all recruit data in GDPR-compliant format.
                  Includes recruit profile, emergency contacts, and related information.
                </>
              )}
            </p>
            <div className="mb-6">
              <Select
                label="Format"
                options={FORMAT_OPTIONS}
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ExportFormatOption)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleCancelExport}
                variant="secondary"
                size="md"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmExport}
                variant="primary"
                size="md"
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
