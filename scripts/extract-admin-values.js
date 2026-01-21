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
  console.error('❌ Error: Please provide the path to the service account JSON file');
  console.error('');
  console.error('Usage: node scripts/extract-admin-values.js <path-to-json-file>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/extract-admin-values.js ~/Downloads/countcard-94c5b-firebase-adminsdk-xxxxx.json');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Error: File not found: ${jsonFilePath}`);
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
    console.error('❌ Error: Missing required fields in JSON file');
    console.error('   Required: project_id, client_email, private_key');
    process.exit(1);
  }

  // Format private key for .env.local (escape newlines)
  // The private key already has \n as literal characters in JSON
  const formattedPrivateKey = privateKey.replace(/\n/g, '\\n');

  console.log('');
  console.log('==========================================');
  console.log('Firebase Admin SDK Configuration Values');
  console.log('==========================================');
  console.log('');
  console.log('Copy these values into your .env.local file:');
  console.log('');
  console.log('FIREBASE_ADMIN_PROJECT_ID=' + projectId);
  console.log('FIREBASE_ADMIN_CLIENT_EMAIL=' + clientEmail);
  console.log('FIREBASE_ADMIN_PRIVATE_KEY="' + formattedPrivateKey + '"');
  console.log('');
  console.log('==========================================');
  console.log('');
  console.log('Or use the update script to automatically update .env.local:');
  console.log(`  ./scripts/update-admin-sdk.sh "${jsonFilePath}"`);
  console.log('');

} catch (error) {
  console.error('❌ Error reading JSON file:');
  console.error('   ' + error.message);
  process.exit(1);
}
