#!/bin/bash

# Quick Authentication Commands
# Run these commands in your terminal to authenticate with Firebase and Google Cloud

echo "=========================================="
echo "Firebase & Google Cloud Authentication"
echo "=========================================="
echo ""
echo "Run these commands in order:"
echo ""
echo "1. Firebase Reauthentication:"
echo "   firebase login --reauth"
echo ""
echo "2. Google Cloud Reauthentication:"
echo "   gcloud auth login"
echo ""
echo "3. Set Google Cloud Project:"
echo "   gcloud config set project countcard-94c5b"
echo "   gcloud auth application-default set-quota-project countcard-94c5b"
echo ""
echo "4. Verify Authentication:"
echo "   firebase projects:list"
echo "   gcloud config get-value project"
echo ""
echo "=========================================="
echo "Note: These commands will open your browser"
echo "      for OAuth authentication."
echo "=========================================="
