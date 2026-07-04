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

process.stdout.write('Opening SiteGround Control Panel...\n');
process.stdout.write('Please authenticate using Google Sign-In with 2FA\n\n');

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
    process.stdout.write(`Please open: ${sitegroundUrl}\n`);
    process.exit(0);
}

exec(command, (error) => {
  if (error) {
    process.stderr.write(`Error opening browser: ${error.message}\n`);
    process.stdout.write(`Please manually open: ${sitegroundUrl}\n`);
    return;
  }

  process.stdout.write('Browser opened successfully!\n\n');
  process.stdout.write('After authentication, navigate to:\n');
  process.stdout.write('  - DNS Zone Editor\n');
  process.stdout.write('  - Domain: warriorwaypoint.com\n');
  process.stdout.write('  - Manage DNS records for countcard.warriorwaypoint.com\n\n');
  process.stdout.write('Note: If SiteGround provides CLI/API access, we can automate DNS management.\n');
});
