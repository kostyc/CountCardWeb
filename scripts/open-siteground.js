#!/usr/bin/env node

/**
 * Script to open SiteGround login page for DNS management
 * User will authenticate via Google Sign-In with 2FA
 * 
 * Usage: node scripts/open-siteground.js
 */

const { exec } = require('child_process');
const os = require('os');

const sitegroundUrl = 'https://www.siteground.com/web-hosting/control-panel';
const dnsZoneEditorPath = '/dns-zone-editor';

console.log('Opening SiteGround Control Panel...');
console.log('Please authenticate using Google Sign-In with 2FA\n');

const platform = os.platform();
let command;

switch (platform) {
  case 'darwin':
    // macOS
    command = `open "${sitegroundUrl}"`;
    break;
  case 'linux':
    // Linux
    command = `xdg-open "${sitegroundUrl}"`;
    break;
  case 'win32':
    // Windows
    command = `start "${sitegroundUrl}"`;
    break;
  default:
    console.log(`Please open: ${sitegroundUrl}`);
    process.exit(0);
}

exec(command, (error) => {
  if (error) {
    console.error(`Error opening browser: ${error.message}`);
    console.log(`Please manually open: ${sitegroundUrl}`);
    return;
  }
  
  console.log('Browser opened successfully!\n');
  console.log('After authentication, navigate to:');
  console.log('  - DNS Zone Editor');
  console.log('  - Domain: warriorwaypoint.com');
  console.log('  - Manage DNS records for countcard.warriorwaypoint.com\n');
  
  // Check for SiteGround CLI/API (future enhancement)
  console.log('Note: If SiteGround provides CLI/API access, we can automate DNS management.');
});
