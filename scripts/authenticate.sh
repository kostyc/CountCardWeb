#!/bin/bash

# Interactive Authentication Script for Firebase and Google Cloud
# This script must be run in an interactive terminal (not through automation)

set -e

PROJECT_ID="countcard-94c5b"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Firebase & Google Cloud Authentication"
echo "=========================================="
echo ""
echo "Project: $PROJECT_ID"
echo ""

# Check if running in interactive mode
if [ ! -t 0 ]; then
    echo "❌ Error: This script must be run in an interactive terminal."
    echo "   Please run this script directly in your terminal:"
    echo "   ./scripts/authenticate.sh"
    exit 1
fi

# Step 1: Firebase Authentication
echo "Step 1: Firebase Authentication"
echo "-------------------------------"
echo "This will open your browser for Firebase authentication..."
echo ""
read -p "Press Enter to continue with Firebase login..."
firebase login --reauth

if [ $? -eq 0 ]; then
    echo "✅ Firebase authentication successful!"
    echo ""
    echo "Verifying Firebase access..."
    if firebase projects:list | grep -q "$PROJECT_ID"; then
        echo "✅ Firebase project '$PROJECT_ID' is accessible"
    else
        echo "⚠️  Warning: Project '$PROJECT_ID' not found in list"
        echo "   Available projects:"
        firebase projects:list
    fi
else
    echo "❌ Firebase authentication failed"
    exit 1
fi

echo ""
echo ""

# Step 2: Google Cloud Authentication
echo "Step 2: Google Cloud Authentication"
echo "-----------------------------------"
echo "This will open your browser for Google Cloud authentication..."
echo ""
read -p "Press Enter to continue with Google Cloud login..."
gcloud auth login

if [ $? -eq 0 ]; then
    echo "✅ Google Cloud authentication successful!"
    echo ""
    echo "Setting Google Cloud project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
    gcloud auth application-default set-quota-project "$PROJECT_ID"
    
    echo ""
    echo "Verifying Google Cloud configuration..."
    CURRENT_PROJECT=$(gcloud config get-value project)
    if [ "$CURRENT_PROJECT" = "$PROJECT_ID" ]; then
        echo "✅ Google Cloud project set to: $CURRENT_PROJECT"
    else
        echo "⚠️  Warning: Project is set to '$CURRENT_PROJECT', expected '$PROJECT_ID'"
    fi
    
    CURRENT_ACCOUNT=$(gcloud config get-value account)
    echo "✅ Authenticated as: $CURRENT_ACCOUNT"
else
    echo "❌ Google Cloud authentication failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "Authentication Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  Firebase: ✅ Authenticated"
echo "  Google Cloud: ✅ Authenticated as $CURRENT_ACCOUNT"
echo "  Project: $PROJECT_ID"
echo ""
echo "Next steps:"
echo "  1. Run: firebase init"
echo "  2. Select Hosting service"
echo "  3. Choose project: $PROJECT_ID"
echo ""
