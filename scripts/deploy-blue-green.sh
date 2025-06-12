#!/bin/bash

# Blue-Green Deployment Script for Invoice System
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BRANCH=${1:-$(git branch --show-current)}
PROJECT_NAME="invoice-system"

echo -e "${YELLOW}🚀 Starting Blue-Green Deployment for branch: $BRANCH${NC}"

# Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}❌ You have uncommitted changes. Please commit or stash them.${NC}"
    exit 1
fi

# Run build test
echo -e "${YELLOW}🔨 Testing build...${NC}"
if ! npm run build; then
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
if ! npm run lint; then
    echo -e "${RED}❌ Linting failed. Please fix errors before deploying.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pre-deployment checks passed${NC}"

# Create deployment branch if it doesn't exist
DEPLOY_BRANCH="deploy-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}🌿 Creating deployment branch: $DEPLOY_BRANCH${NC}"

git checkout -b $DEPLOY_BRANCH

# Deploy to Vercel preview
echo -e "${YELLOW}🚀 Deploying to Vercel preview...${NC}"
if command -v vercel &> /dev/null; then
    PREVIEW_URL=$(vercel --yes --confirm)
    echo -e "${GREEN}✅ Preview deployed to: $PREVIEW_URL${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Please install with: npm i -g vercel${NC}"
    echo -e "${YELLOW}💡 Or deploy via Git push to see preview URL in GitHub${NC}"
    git push origin $DEPLOY_BRANCH
fi

# Wait for user confirmation
echo -e "${YELLOW}🧪 Please test the preview environment thoroughly:${NC}"
echo -e "  • Invoice creation"
echo -e "  • PDF generation"
echo -e "  • Validation messages"
echo -e "  • Mobile responsiveness"
echo -e "  • Database operations"
echo ""

read -p "Has testing passed? Continue with production deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Deployment cancelled. Cleaning up...${NC}"
    git checkout main
    git branch -D $DEPLOY_BRANCH
    exit 0
fi

# Deploy to production
echo -e "${YELLOW}🎯 Deploying to production...${NC}"

# Merge to main and push
git checkout main
git pull origin main
git merge $DEPLOY_BRANCH --no-ff -m "Deploy: Enhanced validation display fixes"

# Tag the release
TAG="v$(date +%Y.%m.%d)-validation-fixes"
git tag -a $TAG -m "Production deployment: Enhanced validation display"

# Push to production
git push origin main
git push origin $TAG

echo -e "${GREEN}✅ Deployed to production!${NC}"

# Post-deployment monitoring reminder
echo -e "${YELLOW}📊 Post-deployment checklist:${NC}"
echo -e "  • Monitor Vercel dashboard for errors"
echo -e "  • Test invoice creation in production"
echo -e "  • Verify PDF generation works"
echo -e "  • Check validation message display"
echo -e "  • Monitor for 30 minutes"

# Cleanup
git branch -D $DEPLOY_BRANCH

echo -e "${GREEN}🎉 Blue-Green deployment completed successfully!${NC}"
echo -e "${YELLOW}💡 Rollback command if needed: git revert $TAG${NC}" 