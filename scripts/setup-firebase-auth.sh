#!/bin/bash

# Firebase and Google Cloud Authentication Setup Script
# This script helps set up authentication for Firebase CLI and Google Cloud CLI

set -e

echo "=========================================="
echo "Firebase & Google Cloud Authentication Setup"
echo "=========================================="
echo ""

# Check if Firebase CLI is installed
echo "Checking Firebase CLI installation..."
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
else
    FIREBASE_VERSION=$(firebase --version)
    echo "✅ Firebase CLI installed: $FIREBASE_VERSION"
fi

# Check if Google Cloud CLI is installed
echo ""
echo "Checking Google Cloud CLI installation..."
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI is not installed."
    echo "   Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
else
    GCLOUD_VERSION=$(gcloud --version | head -n 1)
    echo "✅ Google Cloud CLI installed: $GCLOUD_VERSION"
fi

# Check Firebase authentication status
echo ""
echo "Checking Firebase authentication status..."
if firebase projects:list &> /dev/null; then
    echo "✅ Firebase is already authenticated"
    FIREBASE_AUTHED=true
else
    echo "❌ Firebase authentication required or expired"
    FIREBASE_AUTHED=false
fi

# Check Google Cloud authentication status
echo ""
echo "Checking Google Cloud authentication status..."
GCLOUD_ACCOUNTS=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || echo "")
GCLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -n "$GCLOUD_ACCOUNTS" ]; then
    echo "✅ Google Cloud account listed: $GCLOUD_ACCOUNTS"
    if [ -n "$GCLOUD_PROJECT" ]; then
        echo "   Current project: $GCLOUD_PROJECT"
        if [ "$GCLOUD_PROJECT" = "countcard-94c5b" ]; then
            echo "✅ Project is correctly set to countcard-94c5b"
            GCLOUD_AUTHED=true
        else
            echo "⚠️  Project needs to be changed to countcard-94c5b"
            GCLOUD_AUTHED=false
        fi
    else
        echo "⚠️  No project set - authentication may be expired"
        GCLOUD_AUTHED=false
    fi
else
    echo "❌ Google Cloud authentication required"
    GCLOUD_AUTHED=false
fi

# Test if credentials are actually valid
if [ "$GCLOUD_AUTHED" = true ]; then
    if gcloud projects describe countcard-94c5b &>/dev/null; then
        echo "✅ Google Cloud credentials are valid"
    else
        echo "⚠️  Google Cloud credentials may be expired (reauthentication needed)"
        GCLOUD_AUTHED=false
    fi
fi

echo ""
echo "=========================================="
echo "Authentication Steps Required"
echo "=========================================="
echo ""

if [ "$FIREBASE_AUTHED" = false ]; then
    echo "1. Firebase Authentication:"
    echo "   Run: firebase login --reauth"
    echo "   This will open a browser for OAuth authentication."
    echo ""
fi

if [ "$GCLOUD_AUTHED" = false ]; then
    echo "2. Google Cloud Authentication:"
    echo "   Run: gcloud auth login"
    echo "   This will open a browser for OAuth authentication."
    echo "   After authentication, set project:"
    echo "   gcloud config set project countcard-94c5b"
    echo "   gcloud auth application-default set-quota-project countcard-94c5b"
    echo ""
fi

if [ "$FIREBASE_AUTHED" = true ] && [ "$GCLOUD_AUTHED" = true ]; then
    echo "✅ Both Firebase and Google Cloud are authenticated!"
    echo ""
    echo "Next steps:"
    echo "1. Initialize Firebase in the project: firebase init"
    echo "2. Select Hosting service during initialization"
    echo "3. Configure project ID: countcard-94c5b"
fi

echo ""
echo "=========================================="
echo "Project Information"
echo "=========================================="
echo "Firebase Project ID: countcard-94c5b"
echo "Google Cloud Project: countcard-94c5b"
echo ""
