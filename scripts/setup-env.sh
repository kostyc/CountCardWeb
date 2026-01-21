#!/bin/bash

# Environment Variables Setup Script
# This script helps set up the .env.local file for CountCard Web Application

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "CountCard Web - Environment Setup"
echo "=========================================="
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled. Existing .env.local preserved."
        exit 0
    fi
    echo "📝 Backing up existing .env.local to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Check if template exists
if [ ! -f ".env.local.template" ]; then
    echo "❌ Error: .env.local.template not found!"
    echo "   Please ensure you're in the project root directory."
    exit 1
fi

# Copy template to .env.local
echo "📋 Copying .env.local.template to .env.local..."
cp .env.local.template .env.local

echo ""
echo "✅ .env.local file created!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Open .env.local in your editor"
echo "2. Get Firebase Client SDK config from:"
echo "   https://console.firebase.google.com/project/countcard-94c5b/settings/general"
echo "   → Scroll to 'Your apps' section"
echo "   → Copy values from Firebase SDK snippet"
echo ""
echo "3. Get Firebase Admin SDK config from:"
echo "   https://console.firebase.google.com/project/countcard-94c5b/settings/serviceaccounts/adminsdk"
echo "   → Click 'Generate new private key'"
echo "   → Download JSON file"
echo "   → Extract: project_id, client_email, private_key"
echo ""
echo "4. Fill in all values in .env.local"
echo ""
echo "5. Restart the dev server: npm run dev"
echo ""
echo "📖 For detailed instructions, see: ENV-SETUP-GUIDE.md"
echo ""
echo "=========================================="
