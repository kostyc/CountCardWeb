#!/bin/bash

# App Check Setup Script for CountCard Web Application
# This script sets up Firebase App Check with reCAPTCHA Enterprise via gcloud

set -e  # Exit on error

PROJECT_ID="countcard-94c5b"
APP_ID=""  # Will be set from Firebase config

echo "🔐 Firebase App Check Setup Script"
echo "=================================="
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud"
    echo "Run: gcloud auth login"
    exit 1
fi

# Verify project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "⚠️  Warning: Current project is '$CURRENT_PROJECT', expected '$PROJECT_ID'"
    echo "Setting project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
fi

echo "✅ gcloud authenticated and project set"
echo ""

# Step 1: Enable required APIs
echo "📦 Step 1: Enabling required APIs..."
gcloud services enable recaptchaenterprise.googleapis.com --project="$PROJECT_ID" || echo "⚠️  reCAPTCHA Enterprise API may already be enabled"
gcloud services enable firebaseappcheck.googleapis.com --project="$PROJECT_ID" || echo "⚠️  App Check API may already be enabled"
echo "✅ APIs enabled"
echo ""

# Step 2: Create reCAPTCHA Enterprise key
echo "🔑 Step 2: Creating reCAPTCHA Enterprise key..."
echo "This will create a reCAPTCHA Enterprise key for web attestation."

# Check if key already exists
EXISTING_KEY=$(gcloud recaptcha keys list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | head -1 || echo "")

if [ -n "$EXISTING_KEY" ]; then
    echo "⚠️  Found existing reCAPTCHA key: $EXISTING_KEY"
    read -p "Use existing key? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        RECAPTCHA_KEY_NAME="$EXISTING_KEY"
        echo "✅ Using existing key"
    else
        echo "Creating new key..."
        RECAPTCHA_KEY_NAME=$(gcloud recaptcha keys create \
            --display-name="CountCard Web App Check" \
            --web \
            --allow-all-domains \
            --project="$PROJECT_ID" \
            --format="value(name)" 2>&1)
        echo "✅ Created new key: $RECAPTCHA_KEY_NAME"
    fi
else
    echo "Creating new reCAPTCHA Enterprise key..."
    RECAPTCHA_KEY_NAME=$(gcloud recaptcha keys create \
        --display-name="CountCard Web App Check" \
        --web \
        --allow-all-domains \
        --project="$PROJECT_ID" \
        --format="value(name)" 2>&1)
    echo "✅ Created key: $RECAPTCHA_KEY_NAME"
fi

# Extract key ID from full resource name
RECAPTCHA_KEY_ID=$(echo "$RECAPTCHA_KEY_NAME" | sed 's/.*\/\([^/]*\)$/\1/')
echo "   Key ID: $RECAPTCHA_KEY_ID"
echo ""

# Step 3: Get Firebase App ID
echo "📱 Step 3: Getting Firebase App ID..."
if [ -f ".env.local" ]; then
    APP_ID=$(grep "NEXT_PUBLIC_FIREBASE_APP_ID" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
    if [ -z "$APP_ID" ]; then
        echo "⚠️  Could not find NEXT_PUBLIC_FIREBASE_APP_ID in .env.local"
        read -p "Enter Firebase App ID: " APP_ID
    fi
else
    echo "⚠️  .env.local not found"
    read -p "Enter Firebase App ID: " APP_ID
fi

if [ -z "$APP_ID" ]; then
    echo "❌ Error: App ID is required"
    exit 1
fi

echo "✅ App ID: $APP_ID"
echo ""

# Step 4: Register App Check app with reCAPTCHA Enterprise
echo "🔐 Step 4: Registering App Check app..."
echo "Registering web app with reCAPTCHA Enterprise provider..."

# Check if App Check app already exists
EXISTING_APP=$(gcloud firebase appcheck apps list --project="$PROJECT_ID" --format="value(name)" 2>/dev/null | grep "$APP_ID" || echo "")

if [ -n "$EXISTING_APP" ]; then
    echo "⚠️  App Check app already exists for this App ID"
    read -p "Continue with registration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping App Check registration"
        exit 0
    fi
fi

# Register the app
echo "Registering app with App Check..."
gcloud firebase appcheck apps update "$APP_ID" \
    --recaptcha-enterprise-key="projects/$PROJECT_ID/keys/$RECAPTCHA_KEY_ID" \
    --project="$PROJECT_ID" 2>&1 || \
gcloud firebase appcheck apps create "$APP_ID" \
    --platform="WEB" \
    --recaptcha-enterprise-key="projects/$PROJECT_ID/keys/$RECAPTCHA_KEY_ID" \
    --project="$PROJECT_ID" 2>&1

echo "✅ App Check app registered"
echo ""

# Step 5: Display summary
echo "📋 Setup Summary"
echo "================"
echo "Project ID: $PROJECT_ID"
echo "App ID: $APP_ID"
echo "reCAPTCHA Key ID: $RECAPTCHA_KEY_ID"
echo "reCAPTCHA Key Name: $RECAPTCHA_KEY_NAME"
echo ""
echo "✅ App Check setup complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Add App Check initialization to your Firebase config (lib/firebase/config.ts)"
echo "2. For development, get a debug token:"
echo "   gcloud firebase appcheck debug-tokens create --app=\"$APP_ID\" --project=\"$PROJECT_ID\""
echo "3. Add the debug token to your .env.local as NEXT_PUBLIC_APP_CHECK_DEBUG_TOKEN"
echo "4. Monitor App Check metrics before enabling enforcement"
echo "5. Enable enforcement gradually in Firebase Console"
echo ""
echo "📚 Documentation: See scripts/APP-CHECK-SETUP-GUIDE.md"
