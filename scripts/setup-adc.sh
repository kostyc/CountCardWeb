#!/bin/bash

# Application Default Credentials (ADC) Setup Script
# This script helps set up ADC for Firebase Admin SDK when service account keys
# cannot be generated due to organization policies

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Firebase Admin SDK - ADC Setup"
echo "=========================================="
echo ""
echo "Since service account key creation is restricted by organization policy,"
echo "we'll use Application Default Credentials (ADC) instead."
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo ""
    echo "Please install Google Cloud SDK:"
    echo "  https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

echo "✅ gcloud CLI found"
echo ""

# Check if already authenticated
if gcloud auth application-default print-access-token &> /dev/null; then
    echo "✅ Application Default Credentials already configured"
    echo ""
    echo "Current credentials:"
    gcloud auth application-default print-access-token &> /dev/null && echo "  Status: Active"
    echo ""
    read -p "Do you want to re-authenticate? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ Using existing ADC credentials"
        exit 0
    fi
fi

echo "Setting up Application Default Credentials..."
echo ""
echo "This will:"
echo "  1. Open your browser for Google authentication"
echo "  2. Set up ADC for local development"
echo "  3. Configure the project: countcard-94c5b"
echo ""

# Set the project
echo "📋 Setting Google Cloud project to: countcard-94c5b"
gcloud config set project countcard-94c5b

# Login with ADC
echo ""
echo "🔐 Starting authentication..."
echo "   (This will open your browser)"
echo ""
gcloud auth application-default login

# Set quota project
echo ""
echo "📋 Setting quota project..."
gcloud auth application-default set-quota-project countcard-94c5b

echo ""
echo "✅ Application Default Credentials configured successfully!"
echo ""
echo "=========================================="
echo "Verification"
echo "=========================================="
echo ""
echo "Project: $(gcloud config get-value project)"
echo "Account: $(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
echo ""
echo "=========================================="
echo "Next Steps"
echo "=========================================="
echo ""
echo "1. Restart your dev server:"
echo "   npm run dev"
echo ""
echo "2. The Firebase Admin SDK will now use ADC automatically"
echo ""
echo "=========================================="
