"use strict";
/**
 * Feature Detection Utilities
 *
 * Provides utilities to detect browser features and capabilities.
 * Used to ensure graceful degradation for unsupported features.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWebCryptoAvailable = isWebCryptoAvailable;
exports.isLocalStorageAvailable = isLocalStorageAvailable;
exports.isSessionStorageAvailable = isSessionStorageAvailable;
exports.isIndexedDBAvailable = isIndexedDBAvailable;
exports.isServiceWorkerSupported = isServiceWorkerSupported;
exports.isFetchAvailable = isFetchAvailable;
exports.isPromiseAvailable = isPromiseAvailable;
exports.isAsyncAwaitSupported = isAsyncAwaitSupported;
exports.isIntersectionObserverAvailable = isIntersectionObserverAvailable;
exports.isResizeObserverAvailable = isResizeObserverAvailable;
exports.getBrowserInfo = getBrowserInfo;
exports.meetsMinimumBrowserRequirements = meetsMinimumBrowserRequirements;
exports.getFeatureSupportReport = getFeatureSupportReport;
/**
 * Check if Web Crypto API is available
 */
function isWebCryptoAvailable() {
    return typeof crypto !== 'undefined' &&
        typeof crypto.subtle !== 'undefined' &&
        typeof window !== 'undefined' &&
        'crypto' in window;
}
/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
    try {
        if (typeof window === 'undefined') {
            return false;
        }
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable() {
    try {
        if (typeof window === 'undefined') {
            return false;
        }
        const test = '__sessionStorage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable() {
    return typeof window !== 'undefined' &&
        'indexedDB' in window &&
        indexedDB !== null;
}
/**
 * Check if Service Workers are supported
 */
function isServiceWorkerSupported() {
    return typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'serviceWorker' in window;
}
/**
 * Check if Fetch API is available
 */
function isFetchAvailable() {
    return typeof fetch !== 'undefined';
}
/**
 * Check if Promise is available
 */
function isPromiseAvailable() {
    return typeof Promise !== 'undefined';
}
/**
 * Check if async/await is supported (ES2017)
 */
function isAsyncAwaitSupported() {
    try {
        // eslint-disable-next-line no-eval
        eval('(async () => {})');
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if IntersectionObserver is available
 */
function isIntersectionObserverAvailable() {
    return typeof window !== 'undefined' &&
        'IntersectionObserver' in window;
}
/**
 * Check if ResizeObserver is available
 */
function isResizeObserverAvailable() {
    return typeof window !== 'undefined' &&
        'ResizeObserver' in window;
}
/**
 * Get browser information
 */
function getBrowserInfo() {
    if (typeof window === 'undefined') {
        return {
            name: 'Unknown',
            version: 'Unknown',
            isSafari: false,
            isChrome: false,
            isEdge: false,
            isFirefox: false,
        };
    }
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let isSafari = false;
    let isChrome = false;
    let isEdge = false;
    let isFirefox = false;
    // Detect Safari
    if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent) && !/Chromium/.test(userAgent)) {
        name = 'Safari';
        isSafari = true;
        const match = userAgent.match(/Version\/(\d+)/);
        if (match) {
            version = match[1];
        }
    }
    // Detect Chrome
    else if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) {
        name = 'Chrome';
        isChrome = true;
        const match = userAgent.match(/Chrome\/(\d+)/);
        if (match) {
            version = match[1];
        }
    }
    // Detect Edge
    else if (/Edg/.test(userAgent)) {
        name = 'Edge';
        isEdge = true;
        const match = userAgent.match(/Edg\/(\d+)/);
        if (match) {
            version = match[1];
        }
    }
    // Detect Firefox
    else if (/Firefox/.test(userAgent)) {
        name = 'Firefox';
        isFirefox = true;
        const match = userAgent.match(/Firefox\/(\d+)/);
        if (match) {
            version = match[1];
        }
    }
    return {
        name,
        version,
        isSafari,
        isChrome,
        isEdge,
        isFirefox,
    };
}
/**
 * Check if browser meets minimum requirements
 * Safari 14+, Chrome 90+, Firefox 90+, Edge 90+
 */
function meetsMinimumBrowserRequirements() {
    const browserInfo = getBrowserInfo();
    if (browserInfo.name === 'Unknown') {
        // If we can't detect the browser, assume it meets requirements
        // (server-side rendering)
        return true;
    }
    const version = parseInt(browserInfo.version, 10);
    if (browserInfo.isSafari) {
        return version >= 14;
    }
    if (browserInfo.isChrome) {
        return version >= 90;
    }
    if (browserInfo.isFirefox) {
        return version >= 90;
    }
    if (browserInfo.isEdge) {
        return version >= 90;
    }
    // For other browsers, check if they support required features
    return isWebCryptoAvailable() &&
        isFetchAvailable() &&
        isPromiseAvailable() &&
        isAsyncAwaitSupported();
}
/**
 * Get feature support report
 */
function getFeatureSupportReport() {
    return {
        webCrypto: isWebCryptoAvailable(),
        localStorage: isLocalStorageAvailable(),
        sessionStorage: isSessionStorageAvailable(),
        indexedDB: isIndexedDBAvailable(),
        serviceWorker: isServiceWorkerSupported(),
        fetch: isFetchAvailable(),
        promise: isPromiseAvailable(),
        asyncAwait: isAsyncAwaitSupported(),
        intersectionObserver: isIntersectionObserverAvailable(),
        resizeObserver: isResizeObserverAvailable(),
        meetsMinimumRequirements: meetsMinimumBrowserRequirements(),
    };
}
//# sourceMappingURL=featureDetection.js.map