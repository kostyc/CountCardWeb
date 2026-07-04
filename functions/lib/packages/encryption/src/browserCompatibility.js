"use strict";
/**
 * Encryption Browser Compatibility
 *
 * Provides browser compatibility checks specifically for encryption functionality.
 * Verifies that the browser supports all required features for sodium-plus encryption.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEncryptionCompatibility = checkEncryptionCompatibility;
exports.verifyEncryptionSupport = verifyEncryptionSupport;
exports.canInitializeSodiumPlus = canInitializeSodiumPlus;
exports.getCompatibilityMessage = getCompatibilityMessage;
exports.checkAndLogEncryptionCompatibility = checkAndLogEncryptionCompatibility;
const featureDetection_1 = require("@countcard/core/featureDetection");
const logger_1 = require("@countcard/core/logger");
/**
 * Check if sodium-plus can be used in the current browser
 *
 * Note: sodium-plus uses Web Crypto API internally, so we need to verify
 * that Web Crypto API is available. However, sodium-plus also has fallbacks
 * for browsers without Web Crypto API support.
 *
 * @returns Promise resolving to compatibility check result
 */
async function checkEncryptionCompatibility() {
    const browserInfo = (0, featureDetection_1.getBrowserInfo)();
    const warnings = [];
    const errors = [];
    // Check Web Crypto API availability
    const hasWebCrypto = (0, featureDetection_1.isWebCryptoAvailable)();
    // Check minimum browser version requirements
    const meetsMinimumVersion = (0, featureDetection_1.meetsMinimumBrowserRequirements)();
    // Check if browser meets minimum requirements
    if (!meetsMinimumVersion) {
        errors.push(`Browser version does not meet minimum requirements. ` +
            `Required: Safari 14+, Chrome 90+, Firefox 90+, or Edge 90+. ` +
            `Detected: ${browserInfo.name} ${browserInfo.version}`);
    }
    // Warn if Web Crypto API is not available (sodium-plus may still work with fallbacks)
    if (!hasWebCrypto) {
        warnings.push('Web Crypto API is not available. Encryption may use fallback methods which may be slower.');
    }
    // Check for specific browser issues
    if (browserInfo.isSafari) {
        const version = parseInt(browserInfo.version, 10);
        if (version < 14) {
            errors.push('Safari version 14 or higher is required for encryption support');
        }
    }
    if (browserInfo.isChrome) {
        const version = parseInt(browserInfo.version, 10);
        if (version < 90) {
            errors.push('Chrome version 90 or higher is required for encryption support');
        }
    }
    if (browserInfo.isEdge) {
        const version = parseInt(browserInfo.version, 10);
        if (version < 90) {
            errors.push('Edge version 90 or higher is required for encryption support');
        }
    }
    if (browserInfo.isFirefox) {
        const version = parseInt(browserInfo.version, 10);
        if (version < 90) {
            errors.push('Firefox version 90 or higher is required for encryption support');
        }
    }
    // Determine overall compatibility
    // Encryption is compatible if there are no errors (warnings are acceptable)
    const isCompatible = errors.length === 0;
    const result = {
        isCompatible,
        browserName: browserInfo.name,
        browserVersion: browserInfo.version,
        hasWebCrypto,
        meetsMinimumVersion,
        warnings,
        errors,
    };
    // Log compatibility check result
    if (isCompatible) {
        (0, logger_1.logInfo)(`Encryption compatibility check passed (${browserInfo.name} ${browserInfo.version})`, 'encryption.browserCompatibility');
    }
    else {
        (0, logger_1.logWarning)(`Encryption compatibility check failed: ${errors.join('; ')}`, 'encryption.browserCompatibility');
    }
    if (warnings.length > 0) {
        (0, logger_1.logWarning)(`Encryption compatibility warnings: ${warnings.join('; ')}`, 'encryption.browserCompatibility');
    }
    return result;
}
/**
 * Verify that encryption can be used in the current browser
 * Throws an error if encryption is not supported
 *
 * @throws Error if encryption is not supported
 */
async function verifyEncryptionSupport() {
    const compatibility = await checkEncryptionCompatibility();
    if (!compatibility.isCompatible) {
        const errorMessage = `Encryption is not supported in this browser. ` +
            `Errors: ${compatibility.errors.join('; ')}. ` +
            `Please use Safari 14+, Chrome 90+, Firefox 90+, or Edge 90+.`;
        throw new Error(errorMessage);
    }
}
/**
 * Check if sodium-plus can be initialized
 *
 * NOTE: This function is temporarily disabled to avoid build issues with sodium-native.
 * sodium-native is a Node.js native module that cannot be bundled for the browser.
 *
 * When encryption is actually needed, sodium-plus should be imported directly
 * in the encryption service, which will handle browser vs server backends automatically.
 *
 * @returns Promise resolving to true (assumes compatibility based on browser check)
 */
async function canInitializeSodiumPlus() {
    // For now, we assume compatibility based on the browser compatibility check
    // Actual sodium-plus initialization will happen when encryption is used
    // This avoids bundling sodium-native (Node.js only) for the client
    const compatibility = await checkEncryptionCompatibility();
    return compatibility.isCompatible;
}
/**
 * Get user-friendly browser compatibility message
 *
 * @param compatibility - Compatibility check result
 * @returns User-friendly message
 */
function getCompatibilityMessage(compatibility) {
    if (compatibility.isCompatible) {
        if (compatibility.warnings.length > 0) {
            return `Encryption is supported but with warnings: ${compatibility.warnings.join('; ')}`;
        }
        return 'Encryption is fully supported in this browser.';
    }
    return `Encryption is not supported: ${compatibility.errors.join('; ')}`;
}
/**
 * Check if browser supports encryption and log compatibility status
 * This should be called on app initialization
 */
async function checkAndLogEncryptionCompatibility() {
    const compatibility = await checkEncryptionCompatibility();
    const message = getCompatibilityMessage(compatibility);
    if (compatibility.isCompatible) {
        (0, logger_1.logInfo)(message, 'encryption.browserCompatibility');
    }
    else {
        (0, logger_1.logWarning)(message, 'encryption.browserCompatibility');
    }
}
//# sourceMappingURL=browserCompatibility.js.map