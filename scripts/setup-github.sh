#!/bin/bash

# GitHub Repository Setup Script for CountCard Web
# This script creates a GitHub repository and connects it to the local repository

set -e

GITHUB_USERNAME="kostyc"
REPO_NAME="CountCardWeb"
DESCRIPTION="Marine Corps Drill Instructor accountability application for tracking and managing recruits"

echo "🚀 Setting up GitHub connection for CountCard Web..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "⚠️  You are not authenticated with GitHub."
    echo "   Please run: gh auth login"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated."

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "⚠️  A remote 'origin' already exists."
    read -p "   Do you want to replace it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote remove origin
    else
        echo "   Keeping existing remote. Exiting."
        exit 0
    fi
fi

# Create repository on GitHub
echo "📦 Creating repository on GitHub..."
gh repo create "$GITHUB_USERNAME/$REPO_NAME" \
    --description "$DESCRIPTION" \
    --public \
    --source=. \
    --remote=origin \
    --push

echo "✅ GitHub repository created and connected!"
echo "🌐 Repository URL: $(gh repo view --web)"
