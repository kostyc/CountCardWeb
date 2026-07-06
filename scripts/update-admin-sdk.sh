#!/bin/bash

# Firebase Admin SDK Configuration Update Script
# This script extracts values from a Firebase service account JSON file
# and updates the .env.local file with Admin SDK credentials

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Firebase Admin SDK Configuration Updater"
echo "=========================================="
echo ""

# Check if JSON file path provided
if [ -z "$1" ]; then
    echo "Usage: ./scripts/update-admin-sdk.sh <path-to-service-account-json>"
    echo ""
    echo "Example:"
    echo "  ./scripts/update-admin-sdk.sh ~/Downloads/countcard-94c5b-firebase-adminsdk-xxxxx.json"
    echo ""
    echo "Or if the file is in the project directory:"
    echo "  ./scripts/update-admin-sdk.sh ./service-account-key.json"
    echo ""
    exit 1
fi

JSON_FILE="$1"

# Check if JSON file exists
if [ ! -f "$JSON_FILE" ]; then
    echo "❌ Error: JSON file not found: $JSON_FILE"
    echo ""
    echo "Please provide the path to the downloaded service account JSON file."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "   Please run ./scripts/setup-env.sh first to create .env.local"
    exit 1
fi

echo "📄 Reading service account JSON file: $JSON_FILE"
echo ""

# Extract values from JSON file
PROJECT_ID=$(grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$JSON_FILE" | cut -d'"' -f4)
CLIENT_EMAIL=$(grep -o '"client_email"[[:space:]]*:[[:space:]]*"[^"]*"' "$JSON_FILE" | cut -d'"' -f4)
PRIVATE_KEY=$(grep -o '"private_key"[[:space:]]*:[[:space:]]*"[^"]*"' "$JSON_FILE" | cut -d'"' -f4)

# Validate extracted values
if [ -z "$PROJECT_ID" ] || [ -z "$CLIENT_EMAIL" ] || [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: Could not extract all required values from JSON file"
    echo ""
    echo "Expected fields: project_id, client_email, private_key"
    echo ""
    echo "Please verify the JSON file is a valid Firebase service account key."
    exit 1
fi

echo "✅ Extracted values:"
echo "   Project ID: $PROJECT_ID"
echo "   Client Email: $CLIENT_EMAIL"
echo "   Private Key: [hidden for security]"
echo ""

# Format private key for .env.local (replace actual \n with \n escape sequences)
# The private key from JSON already has \n as literal characters, we need to preserve them
FORMATTED_PRIVATE_KEY=$(echo "$PRIVATE_KEY" | sed 's/\\n/\\n/g')

# Create backup of .env.local
BACKUP_FILE=".env.local.backup.$(date +%Y%m%d_%H%M%S)"
cp .env.local "$BACKUP_FILE"
echo "💾 Backup created: $BACKUP_FILE"
echo ""

# Update .env.local with Admin SDK values
# Use a temporary file to avoid issues with sed on macOS
TEMP_FILE=$(mktemp)

# Update FIREBASE_ADMIN_PROJECT_ID
sed "s|^FIREBASE_ADMIN_PROJECT_ID=.*|FIREBASE_ADMIN_PROJECT_ID=$PROJECT_ID|" .env.local > "$TEMP_FILE"
mv "$TEMP_FILE" .env.local

# Update FIREBASE_ADMIN_CLIENT_EMAIL (also uncomments if previously commented out)
sed -E "s|^#?[[:space:]]*FIREBASE_ADMIN_CLIENT_EMAIL=.*|FIREBASE_ADMIN_CLIENT_EMAIL=$CLIENT_EMAIL|" .env.local > "$TEMP_FILE"
mv "$TEMP_FILE" .env.local

# Update FIREBASE_ADMIN_PRIVATE_KEY (this is tricky due to special characters)
# We need to escape the private key properly; also uncomments if previously commented out
TEMP_FILE2=$(mktemp)
awk -v new_key="$FORMATTED_PRIVATE_KEY" '
    /^#?[[:space:]]*FIREBASE_ADMIN_PRIVATE_KEY=/ {
        print "FIREBASE_ADMIN_PRIVATE_KEY=\"" new_key "\""
        next
    }
    { print }
' .env.local > "$TEMP_FILE2"
mv "$TEMP_FILE2" .env.local

echo "✅ .env.local updated with Firebase Admin SDK credentials!"
echo ""
echo "3. Verify Admin SDK:"
echo "   node scripts/verify-admin-sdk.mjs"
echo ""
echo "4. Run Sprint 27 API E2E:"
echo "   npm run dev:web   # separate terminal"
echo "   node scripts/sprint27-e2e.mjs"
echo ""
echo "=========================================="
echo "⚠️  Security Reminder:"
echo "=========================================="
echo "The service account JSON file contains sensitive credentials."
echo "Consider deleting it after updating .env.local:"
echo "   rm \"$JSON_FILE\""
echo ""
