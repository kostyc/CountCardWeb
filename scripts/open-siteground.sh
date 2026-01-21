#!/bin/bash

# Script to open SiteGround login page for DNS management
# User will authenticate via Google Sign-In with 2FA

echo "Opening SiteGround Control Panel..."
echo "Please authenticate using Google Sign-In with 2FA"

# Open SiteGround login page in default browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "https://www.siteground.com/web-hosting/control-panel"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "https://www.siteground.com/web-hosting/control-panel"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start "https://www.siteground.com/web-hosting/control-panel"
else
    echo "Please open: https://www.siteground.com/web-hosting/control-panel"
fi

echo ""
echo "After authentication, navigate to:"
echo "  - DNS Zone Editor"
echo "  - Domain: warriorwaypoint.com"
echo "  - Manage DNS records for countcard.warriorwaypoint.com"
