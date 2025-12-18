#!/bin/bash

# Deploy to Portal Script
# This script pulls latest changes from main and deploys to 3c-frontend portal branch

set -e  # Exit on any error

echo "🔄 Switching to main branch..."
git checkout main

echo "📥 Pulling latest changes from origin/main..."
git pull origin main

echo "📊 Recent commits:"
git log --oneline -5

echo ""
read -p "Deploy these changes to portal branch? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🚀 Pushing to frontend portal branch..."
    git push frontend main:portal --force

    echo ""
    echo "✅ Done! Your changes are now deploying on AWS Amplify."
    echo "🌐 Check your Amplify console for deployment status."
else
    echo "❌ Deployment cancelled."
    exit 1
fi
