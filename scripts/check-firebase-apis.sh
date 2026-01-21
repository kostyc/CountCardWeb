#!/bin/bash

# Firebase API Check and Enable Script
# Checks which Firebase/Google Cloud APIs are enabled and enables missing ones
# Required for Firebase Authentication to work properly

set -e

PROJECT_ID="countcard-94c5b"

echo "🔍 Checking Firebase/Google Cloud APIs for project: $PROJECT_ID"
echo ""

# Set the project
gcloud config set project $PROJECT_ID

# Required APIs for Firebase Authentication and related services
# Format: "API_NAME|Display Name"
REQUIRED_APIS=(
    "identitytoolkit.googleapis.com|Identity Toolkit API (Firebase Authentication)"
    "firestore.googleapis.com|Cloud Firestore API"
    "storage-component.googleapis.com|Cloud Storage API"
    "logging.googleapis.com|Cloud Logging API"
    "cloudfunctions.googleapis.com|Cloud Functions API (if using Functions)"
    "appcheck.googleapis.com|Firebase App Check API (if using App Check)"
)

echo "📋 Checking required APIs..."
echo ""

ENABLED_COUNT=0
DISABLED_COUNT=0
DISABLED_APIS=()

for API_ENTRY in "${REQUIRED_APIS[@]}"; do
    IFS='|' read -r API API_NAME <<< "$API_ENTRY"
    
    # Check if API is enabled
    if gcloud services list --enabled --filter="name:$API" --format="value(name)" 2>/dev/null | grep -q "$API"; then
        echo "✅ $API_NAME"
        echo "   Status: ENABLED"
        ((ENABLED_COUNT++))
    else
        echo "❌ $API_NAME"
        echo "   Status: DISABLED"
        DISABLED_APIS+=("$API")
        ((DISABLED_COUNT++))
    fi
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   Enabled:  $ENABLED_COUNT"
echo "   Disabled: $DISABLED_COUNT"
echo ""

if [ $DISABLED_COUNT -eq 0 ]; then
    echo "✅ All required APIs are enabled!"
    echo ""
    exit 0
fi

echo "⚠️  Some required APIs are disabled."
echo ""
echo "Would you like to enable the missing APIs? (y/n)"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo ""
    echo "🔧 Enabling missing APIs..."
    echo ""
    
    for API in "${DISABLED_APIS[@]}"; do
        API_NAME="${REQUIRED_APIS[$API]}"
        echo "Enabling: $API_NAME ($API)"
        gcloud services enable "$API" --project="$PROJECT_ID"
        echo "✅ Enabled: $API_NAME"
        echo ""
    done
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ All missing APIs have been enabled!"
    echo ""
    echo "⏳ Note: It may take a few minutes for the APIs to fully activate."
    echo "   You can verify by running this script again."
    echo ""
else
    echo ""
    echo "To enable APIs manually, run:"
    echo "  gcloud services enable <API_NAME> --project=$PROJECT_ID"
    echo ""
    echo "Or enable them in the Google Cloud Console:"
    echo "  https://console.cloud.google.com/apis/library?project=$PROJECT_ID"
    echo ""
fi
