import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: output: "export" is for static export builds only
  // For development, this doesn't affect environment variable loading
  // Uncomment for production static export builds:
  // output: "export",
  images: {
    unoptimized: true,
  },
  // Configure browser compatibility
  // Next.js 16 uses SWC/Turbopack which automatically handles transpilation based on browserslist
  // Target browsers: Safari 14+, Chrome 90+, Edge 90+
  // Browserslist is configured in package.json
  // Turbopack is enabled by default in Next.js 16
  // Note: sodium-native exclusion is handled in code by only importing sodium-plus in browser context
  
  // Security headers for all routes
  async headers() {
    // Default CSP - allows Firebase, Google APIs, reCAPTCHA, and self
    // Note: upgrade-insecure-requests is only enabled in production
    // to avoid TLS errors in development (dev server runs on HTTP)
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://www.gstatic.com https://www.google.com https://www.gstatic.com/recaptcha",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://firestore.googleapis.com https://*.google.com https://www.google.com https://www.gstatic.com wss://*.firebaseio.com ws://localhost:*",
      "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://www.gstatic.com/recaptcha",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];
    
    // Only add upgrade-insecure-requests in production
    if (process.env.NODE_ENV === 'production') {
      cspDirectives.push("upgrade-insecure-requests");
    }
    
    const defaultCSP = cspDirectives.join('; ');

    // Default Permissions-Policy - restricts most browser features
    // Note: Removed deprecated features: ambient-light-sensor, battery, document-domain,
    // execution-while-not-rendered, execution-while-out-of-viewport, navigation-override
    const defaultPermissionsPolicy = [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ].join(', ');

    // HSTS header (only in production)
    const hstsHeader = process.env.NODE_ENV === 'production'
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined;

    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: defaultCSP,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: defaultPermissionsPolicy,
          },
          // HSTS only in production
          ...(hstsHeader
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: hstsHeader,
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
