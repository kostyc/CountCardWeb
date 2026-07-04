/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This service worker safely handles Firebase Cloud Messaging initialization.
 * It prevents errors when Firebase is not yet initialized by checking for
 * Firebase availability before attempting to use it.
 * 
 * This service worker will not cause errors if:
 * - Firebase is not loaded
 * - Firebase is not initialized
 * - Messaging is not being used
 */

// Wrap everything in IIFE to avoid global scope pollution and errors
(function() {
  'use strict';

  // Set to true only for local debugging; never log in production (no PII/tokens).
  var DEBUG_MESSAGING = false;

  /**
   * Safely initialize Firebase messaging
   * Only initializes if Firebase is properly loaded and initialized
   */
  function initializeMessaging() {
    try {
      // First check: Is Firebase available at all?
      if (typeof firebase === 'undefined' || firebase === null) {
        // Firebase not loaded - this is expected if messaging isn't being used
        return;
      }

      // Second check: Is Firebase app initialized?
      if (!firebase.apps || !Array.isArray(firebase.apps) || firebase.apps.length === 0) {
        // Firebase not initialized - this is expected if messaging isn't being used
        return;
      }

      // Third check: Is messaging function available?
      if (!firebase.messaging || typeof firebase.messaging !== 'function') {
        // Messaging not available - this is expected if messaging isn't being used
        return;
      }

      // All checks passed - safe to initialize messaging
      const messaging = firebase.messaging();

      // Final check: Is messaging object valid and has onBackgroundMessage?
      if (!messaging || typeof messaging.onBackgroundMessage !== 'function') {
        return;
      }

      // Set up background message handler
      messaging.onBackgroundMessage((payload) => {
        try {
          if (DEBUG_MESSAGING) {
            console.log('[firebase-messaging-sw.js] Received background message');
          }

          const notificationTitle = payload.notification?.title || 'New Message';
          const notificationOptions = {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: payload.data?.tag || 'default',
            requireInteraction: false,
            ...payload.notification
          };

          return self.registration.showNotification(notificationTitle, notificationOptions);
        } catch (notificationError) {
          if (DEBUG_MESSAGING) {
            console.error('[firebase-messaging-sw.js] Error showing notification');
          }
        }
      });

      if (DEBUG_MESSAGING) {
        console.log('[firebase-messaging-sw.js] Firebase Messaging initialized successfully');
      }
    } catch (error) {
      // Silently handle all errors - don't break the service worker
      if (DEBUG_MESSAGING) {
        console.warn('[firebase-messaging-sw.js] Messaging initialization skipped');
      }
    }
  }

  // Try to initialize messaging when service worker is activated
  // This will only succeed if Firebase is already initialized
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      Promise.resolve().then(() => {
        // Small delay to ensure Firebase is initialized if it's going to be
        setTimeout(initializeMessaging, 100);
      })
    );
  });

  // Also try to initialize immediately (in case Firebase is already loaded)
  // This is safe because all checks are defensive
  initializeMessaging();
})();
