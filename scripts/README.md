# CountCard Scripts

Utility scripts for CountCard project management and deployment.

## SiteGround Access

### open-siteground.sh / open-siteground.js

Opens SiteGround Control Panel login page for DNS management.

**Usage:**
```bash
# Bash script (macOS/Linux)
./scripts/open-siteground.sh

# Node.js script (cross-platform)
node scripts/open-siteground.js
```

**What it does:**
- Opens SiteGround login page in your default browser
- User authenticates via Google Sign-In with 2FA
- Navigate to DNS Zone Editor for `warriorwaypoint.com` domain management

**When to use:**
- Need to modify DNS records for `countcard.warriorwaypoint.com`
- Checking DNS propagation status
- Managing domain configuration

**Note:** SiteGround access requires Google Sign-In with 2FA. The script only opens the login page - you'll need to complete authentication manually.

## Firebase & Google Cloud Authentication

### setup-firebase-auth.sh

Checks the authentication status of Firebase CLI and Google Cloud CLI.

**Usage:**
```bash
./scripts/setup-firebase-auth.sh
```

**What it does:**
- Checks if Firebase CLI and Google Cloud CLI are installed
- Verifies authentication status for both services
- Displays current project configuration
- Provides instructions for authentication if needed

### authenticate.sh

Interactive script to authenticate with Firebase and Google Cloud.

**Usage:**
```bash
./scripts/authenticate.sh
```

**What it does:**
- Guides you through Firebase reauthentication (`firebase login --reauth`)
- Guides you through Google Cloud authentication (`gcloud auth login`)
- Sets Google Cloud project to `countcard-94c5b`
- Verifies authentication and project configuration

**Note:** This script must be run in an interactive terminal (not through automation tools).

### FIREBASE-AUTH-GUIDE.md

Comprehensive guide for Firebase and Google Cloud authentication, including troubleshooting steps.

## Future Scripts

Additional scripts will be added here as needed for:
- Firebase deployment automation
- DNS record management (if SiteGround CLI/API becomes available)
- Environment setup and configuration
- Database migration scripts
