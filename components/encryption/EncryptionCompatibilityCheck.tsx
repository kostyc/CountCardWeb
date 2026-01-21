/**
 * Encryption Compatibility Check Component
 * 
 * Checks browser compatibility for encryption on app load.
 * Logs warnings/errors if encryption is not fully supported.
 */

'use client';

import { useEffect } from 'react';
import { checkAndLogEncryptionCompatibility, checkEncryptionCompatibility } from '@/lib/encryption/browserCompatibility';
import { logWarning } from '@/lib/utils/logger';

/**
 * Encryption Compatibility Check Component
 * 
 * This component checks browser compatibility for encryption on mount.
 * It logs compatibility status but does not block the app from loading.
 */
export function EncryptionCompatibilityCheck(): JSX.Element | null {
  useEffect(() => {
    // Check encryption compatibility on mount
    const checkCompatibility = async () => {
      try {
        const compatibility = await checkEncryptionCompatibility();
        
        if (!compatibility.isCompatible) {
          // Log error but don't block app
          logWarning(
            `Encryption compatibility check failed: ${compatibility.errors.join('; ')}`,
            'EncryptionCompatibilityCheck'
          );
        } else if (compatibility.warnings.length > 0) {
          // Log warnings
          logWarning(
            `Encryption compatibility warnings: ${compatibility.warnings.join('; ')}`,
            'EncryptionCompatibilityCheck'
          );
        }
        
        // Also run the standard compatibility check
        await checkAndLogEncryptionCompatibility();
      } catch (error) {
        // Don't block app if compatibility check fails
        logWarning(
          `Failed to check encryption compatibility: ${error instanceof Error ? error.message : String(error)}`,
          'EncryptionCompatibilityCheck'
        );
      }
    };
    
    checkCompatibility();
  }, []);
  
  // This component doesn't render anything
  return null;
}
