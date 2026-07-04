#!/usr/bin/env node

/**
 * Firebase Admin SDK Value Extractor
 * 
 * This script reads a Firebase service account JSON file and displays
 * the values needed for .env.local in a format that's easy to copy.
 * 
 * Usage: node scripts/extract-admin-values.js <path-to-json-file>
 */

const fs = require('fs');
const path = require('path');

// Get JSON file path from command line
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  process.stderr.write('❌ Error: Please provide the path to the service account JSON file\n');
  process.stderr.write('\n');
  process.stderr.write('Usage: node scripts/extract-admin-values.js <path-to-json-file>\n');
  process.stderr.write('\n');
  process.stderr.write('Example:\n');
  process.stderr.write('  node scripts/extract-admin-values.js ~/Downloads/countcard-94c5b-firebase-adminsdk-xxxxx.json\n');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  process.stderr.write(`❌ Error: File not found: ${jsonFilePath}\n`);
  process.exit(1);
}

try {
  // Read and parse JSON file
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const serviceAccount = JSON.parse(jsonContent);

  // Extract required values
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  // Validate required fields
  if (!projectId || !clientEmail || !privateKey) {
    process.stderr.write('❌ Error: Missing required fields in JSON file\n');
    process.stderr.write('   Required: project_id, client_email, private_key\n');
    process.exit(1);
  }

  // Format private key for .env.local (escape newlines)
  // The private key already has \n as literal characters in JSON
  const formattedPrivateKey = privateKey.replace(/\n/g, '\\n');

  process.stdout.write('\n');
  process.stdout.write('==========================================\n');
  process.stdout.write('Firebase Admin SDK Configuration Values\n');
  process.stdout.write('==========================================\n');
  process.stdout.write('\n');
  process.stdout.write('Copy these values into your .env.local file:\n');
  process.stdout.write('\n');
  process.stdout.write('FIREBASE_ADMIN_PROJECT_ID=' + projectId + '\n');
  process.stdout.write('FIREBASE_ADMIN_CLIENT_EMAIL=' + clientEmail + '\n');
  process.stdout.write('FIREBASE_ADMIN_PRIVATE_KEY="' + formattedPrivateKey + '"\n');
  process.stdout.write('\n');
  process.stdout.write('==========================================\n');
  process.stdout.write('\n');
  process.stdout.write('Or use the update script to automatically update .env.local:\n');
  process.stdout.write(`  ./scripts/update-admin-sdk.sh "${jsonFilePath}"\n`);
  process.stdout.write('\n');

} catch (error) {
  process.stderr.write('❌ Error reading JSON file:\n');
  process.stderr.write('   ' + (error && error.message ? error.message : String(error)) + '\n');
  process.exit(1);
}
