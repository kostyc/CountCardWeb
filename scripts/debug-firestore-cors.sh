#!/bin/bash

# Debug Firestore CORS/CSP Issues
# Checks Firestore configuration and provides debugging steps

PROJECT_ID="countcard-94c5b"

echo "🔍 Firestore CORS/CSP Debugging Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣  Checking Firestore Security Rules..."
echo ""

if [ -f "firestore.rules" ]; then
    echo "   ✅ firestore.rules file exists"
    echo ""
    echo "   Current rules summary:"
    grep -E "allow|match" firestore.rules | head -10
    echo ""
else
    echo "   ❌ firestore.rules file not found"
    echo ""
fi

echo "2️⃣  Checking CSP Configuration..."
echo ""

if [ -f "next.config.ts" ]; then
    echo "   ✅ next.config.ts found"
    
    if grep -q "firestore.googleapis.com" next.config.ts; then
        echo "   ✅ firestore.googleapis.com is in CSP connect-src"
    else
        echo "   ⚠️  firestore.googleapis.com not explicitly in CSP (may be covered by wildcard)"
    fi
    
    if grep -q "connect-src.*googleapis" next.config.ts; then
        echo "   ✅ googleapis.com domains are in CSP connect-src"
    else
        echo "   ❌ googleapis.com domains are NOT in CSP connect-src"
    fi
    
    echo ""
    echo "   Current connect-src directive:"
    grep "connect-src" next.config.ts | head -1
    echo ""
else
    echo "   ❌ next.config.ts not found"
    echo ""
fi

echo "3️⃣  Checking Firebase Project Configuration..."
echo ""

if command -v firebase &> /dev/null; then
    if firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
        echo "   ✅ Firebase CLI authenticated"
        echo "   ✅ Project $PROJECT_ID is accessible"
        
        echo ""
        echo "   Checking Firestore rules deployment status..."
        firebase firestore:rules:get --project="$PROJECT_ID" 2>/dev/null | head -5 || echo "   ⚠️  Could not retrieve deployed rules"
    else
        echo "   ⚠️  Firebase CLI not authenticated or project not accessible"
        echo "   🔧 Run: firebase login --reauth"
    fi
else
    echo "   ⚠️  Firebase CLI not installed"
fi
echo ""

echo "4️⃣  Recommendations..."
echo ""

echo "   📋 To fix Firestore CORS errors:"
echo ""
echo "   1. Ensure CSP allows Firestore connections:"
echo "      - Add 'https://firestore.googleapis.com' to connect-src"
echo "      - Ensure 'wss://*.firebaseio.com' is in connect-src for WebSockets"
echo ""
echo "   2. Verify Firestore security rules allow access:"
echo "      - Check that userProfiles collection allows read for authenticated users"
echo "      - Deploy rules: firebase deploy --only firestore:rules"
echo ""
echo "   3. Check browser console for specific CSP violations:"
echo "      - Look for 'Refused to connect' errors"
echo "      - Check which directive is blocking the connection"
echo ""
echo "   4. Test Firestore connection:"
echo "      - Open browser DevTools → Network tab"
echo "      - Filter for 'firestore' or 'Listen'"
echo "      - Check if requests are being blocked"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Debug check complete!"
echo ""
