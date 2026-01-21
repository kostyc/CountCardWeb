#!/bin/bash

# Create Pull Request via GitHub API
# Usage: GITHUB_TOKEN=your_token ./scripts/create-pr.sh

set -e

REPO_OWNER="kostyc"
REPO_NAME="CountCardWeb"
BRANCH="add-github-setup-script"
BASE_BRANCH="main"

PR_TITLE="Add GitHub repository setup script"
PR_BODY="## Summary
This PR adds a setup script to automate GitHub repository creation and connection for the CountCard Web project.

## Changes
- Added \`scripts/setup-github.sh\` script that:
  - Checks for GitHub CLI installation
  - Verifies GitHub authentication
  - Creates the repository on GitHub (kostyc/CountCardWeb)
  - Connects the local repository to the remote
  - Handles existing remote scenarios with user prompts

## Benefits
- Streamlines the GitHub setup process for new developers
- Reduces manual steps and potential errors
- Provides clear error messages and guidance

## Testing
- Script has been tested and successfully used to set up the repository
- Includes proper error handling and user feedback"

# Check for token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable is not set."
    echo "   Get a token from: https://github.com/settings/tokens"
    echo "   Then run: GITHUB_TOKEN=your_token ./scripts/create-pr.sh"
    exit 1
fi

echo "🚀 Creating pull request..."

# Create PR via GitHub API
RESPONSE=$(curl -s -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/pulls" \
  -d "{
    \"title\": \"$PR_TITLE\",
    \"body\": \"$PR_BODY\",
    \"head\": \"$BRANCH\",
    \"base\": \"$BASE_BRANCH\"
  }")

# Check if PR was created successfully
PR_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$PR_URL" ]; then
    echo "❌ Failed to create pull request."
    echo "Response: $RESPONSE"
    exit 1
fi

echo "✅ Pull request created successfully!"
echo "🌐 PR URL: $PR_URL"
echo "$PR_URL"
