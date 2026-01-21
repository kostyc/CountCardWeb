#!/bin/bash

# Security Review Script
# Reviews Content Security Policy and Firebase/Google Cloud API status
# Checks authentication status and provides recommendations

set -e

PROJECT_ID="countcard-94c5b"

echo "🔒 Security Review for CountCard Web Application"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check gcloud authentication
echo "1️⃣  Checking Google Cloud Authentication..."
if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    echo "   ✅ Authenticated as: $ACTIVE_ACCOUNT"
else
    echo "   ❌ Not authenticated. Run: gcloud auth login"
    echo ""
    exit 1
fi

# Check current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "   ⚠️  Current project: $CURRENT_PROJECT"
    echo "   🔧 Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID" 2>/dev/null || {
        echo "   ❌ Failed to set project. Check permissions."
        exit 1
    }
else
    echo "   ✅ Project set to: $PROJECT_ID"
fi
echo ""

# Check Firebase/Google Cloud APIs
echo "2️⃣  Checking Required Firebase/Google Cloud APIs..."
echo ""

REQUIRED_APIS=(
    "identitytoolkit.googleapis.com|Identity Toolkit API (Firebase Authentication)"
    "firestore.googleapis.com|Cloud Firestore API"
    "storage-component.googleapis.com|Cloud Storage API"
    "logging.googleapis.com|Cloud Logging API"
    "appcheck.googleapis.com|Firebase App Check API"
)

ENABLED_COUNT=0
DISABLED_COUNT=0
DISABLED_APIS=()

for API_ENTRY in "${REQUIRED_APIS[@]}"; do
    IFS='|' read -r API API_NAME <<< "$API_ENTRY"
    
    if gcloud services list --enabled --filter="name:$API" --format="value(name)" 2>/dev/null | grep -q "$API"; then
        echo "   ✅ $API_NAME"
        echo "      Status: ENABLED"
        ((ENABLED_COUNT++))
    else
        echo "   ❌ $API_NAME"
        echo "      Status: DISABLED"
        DISABLED_APIS+=("$API")
        ((DISABLED_COUNT++))
    fi
    echo ""
done

echo "   📊 Summary: $ENABLED_COUNT enabled, $DISABLED_COUNT disabled"
echo ""

# Check Content Security Policy
echo "3️⃣  Reviewing Content Security Policy Configuration..."
echo ""

CSP_FILE="next.config.ts"
if [ -f "$CSP_FILE" ]; then
    echo "   ✅ Found CSP configuration: $CSP_FILE"
    
    # Check for apis.google.com in script-src
    if grep -q "apis.google.com" "$CSP_FILE"; then
        echo "   ✅ apis.google.com is allowed in script-src"
    else
        echo "   ❌ apis.google.com is NOT in script-src (should be added)"
    fi
    
    # Check for googleapis.com
    if grep -q "googleapis.com" "$CSP_FILE"; then
        echo "   ✅ googleapis.com domains are allowed"
    else
        echo "   ❌ googleapis.com domains are NOT allowed"
    fi
    
    # Check for firebaseapp.com
    if grep -q "firebaseapp.com" "$CSP_FILE"; then
        echo "   ✅ firebaseapp.com domains are allowed"
    else
        echo "   ❌ firebaseapp.com domains are NOT allowed"
    fi
    
    # Check for gstatic.com (reCAPTCHA)
    if grep -q "gstatic.com" "$CSP_FILE"; then
        echo "   ✅ gstatic.com domains are allowed (reCAPTCHA)"
    else
        echo "   ❌ gstatic.com domains are NOT allowed"
    fi
else
    echo "   ❌ CSP configuration file not found: $CSP_FILE"
fi
echo ""

# Check Firebase Authentication
echo "4️⃣  Checking Firebase Authentication Status..."
echo ""

if command -v firebase &> /dev/null; then
    if firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
        echo "   ✅ Firebase CLI authenticated"
        echo "   ✅ Project $PROJECT_ID is accessible"
    else
        echo "   ⚠️  Firebase CLI not authenticated or project not accessible"
        echo "   🔧 Run: firebase login --reauth"
    fi
else
    echo "   ⚠️  Firebase CLI not installed"
    echo "   🔧 Install: npm install -g firebase-tools"
fi
echo ""

# Summary and Recommendations
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary and Recommendations"
echo ""

if [ $DISABLED_COUNT -gt 0 ]; then
    echo "⚠️  Action Required: Enable missing APIs"
    echo ""
    echo "   Run the following commands to enable missing APIs:"
    for API in "${DISABLED_APIS[@]}"; do
        echo "   gcloud services enable $API --project=$PROJECT_ID"
    done
    echo ""
    echo "   Or run the automated script:"
    echo "   ./scripts/check-firebase-apis.sh"
    echo ""
fi

echo "✅ Security review complete!"
echo ""
echo "📚 Additional Resources:"
echo "   - CSP Documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"
echo "   - Firebase API Status: https://console.cloud.google.com/apis/dashboard?project=$PROJECT_ID"
echo "   - Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
