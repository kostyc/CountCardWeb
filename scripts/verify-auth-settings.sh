#!/bin/bash

# Firebase Authentication Settings Verification Script
# Checks Firebase Authentication configuration and provides verification steps

set -e

PROJECT_ID="countcard-94c5b"

echo "🔍 Firebase Authentication Settings Verification"
echo "Project: $PROJECT_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI is not installed."
    echo "   Install it with: npm install -g firebase-tools"
    echo ""
    echo "   For now, we'll check what we can with gcloud..."
    echo ""
    FIREBASE_CLI_AVAILABLE=false
else
    FIREBASE_CLI_AVAILABLE=true
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "⚠️  Google Cloud SDK (gcloud) is not installed."
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    echo ""
    GCLOUD_AVAILABLE=false
else
    GCLOUD_AVAILABLE=true
    gcloud config set project $PROJECT_ID > /dev/null 2>&1
fi

echo "📋 Verification Checklist"
echo ""

# Check APIs
if [ "$GCLOUD_AVAILABLE" = true ]; then
    echo "1️⃣  Checking Required APIs..."
    echo ""
    
    # Identity Toolkit API
    if gcloud services list --enabled --filter="name:identitytoolkit.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "identitytoolkit"; then
        echo "   ✅ Identity Toolkit API: ENABLED"
    else
        echo "   ❌ Identity Toolkit API: DISABLED"
        echo "      Enable with: gcloud services enable identitytoolkit.googleapis.com --project=$PROJECT_ID"
    fi
    
    # Firestore API
    if gcloud services list --enabled --filter="name:firestore.googleapis.com" --format="value(name)" 2>/dev/null | grep -q "firestore"; then
        echo "   ✅ Cloud Firestore API: ENABLED"
    else
        echo "   ❌ Cloud Firestore API: DISABLED"
        echo "      Enable with: gcloud services enable firestore.googleapis.com --project=$PROJECT_ID"
    fi
    
    echo ""
fi

# Firebase CLI checks
if [ "$FIREBASE_CLI_AVAILABLE" = true ]; then
    echo "2️⃣  Checking Firebase Authentication..."
    echo ""
    
    # Check if logged in
    if firebase projects:list &> /dev/null; then
        echo "   ✅ Firebase CLI: Authenticated"
        
        # Try to check auth status (may fail if auth not enabled)
        if firebase auth:export /tmp/firebase_auth_check.json --project=$PROJECT_ID --format=json &> /dev/null 2>&1; then
            echo "   ✅ Firebase Authentication: Enabled"
            rm -f /tmp/firebase_auth_check.json
        else
            echo "   ⚠️  Firebase Authentication: Status unknown (may not be enabled)"
            echo "      Check manually in Firebase Console"
        fi
    else
        echo "   ⚠️  Firebase CLI: Not authenticated"
        echo "      Run: firebase login"
    fi
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Manual Verification Required"
echo ""
echo "The following items must be checked manually in the Firebase Console:"
echo ""
echo "✅ Authentication Providers:"
echo "   → https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"
echo "   Check: Email/Password, Phone, Google, Apple are all enabled"
echo ""
echo "✅ Authorized Domains:"
echo "   → https://console.firebase.google.com/project/$PROJECT_ID/authentication/settings"
echo "   Check: localhost, countcard.warriorwaypoint.com are listed"
echo ""
echo "✅ OAuth Consent Screen:"
echo "   → https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "   Check: App name, support email, authorized domains are configured"
echo ""
echo "✅ OAuth 2.0 Client ID:"
echo "   → https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   Check: Redirect URIs include your domains"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 For detailed verification steps, see:"
echo "   scripts/VERIFY-FIREBASE-AUTH.md"
echo ""
