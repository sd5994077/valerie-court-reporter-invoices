# Blue-Green Deployment Script for Invoice System (PowerShell)
param(
    [string]$Branch = (git branch --show-current)
)

# Configuration
$ProjectName = "invoice-system"

Write-Host "🚀 Starting Blue-Green Deployment for branch: $Branch" -ForegroundColor Yellow

# Pre-deployment checks
Write-Host "📋 Running pre-deployment checks..." -ForegroundColor Yellow

# Check if we're in a git repository
try {
    git rev-parse --git-dir | Out-Null
} catch {
    Write-Host "❌ Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "❌ You have uncommitted changes. Please commit or stash them." -ForegroundColor Red
    exit 1
}

# Run build test
Write-Host "🔨 Testing build..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
} catch {
    Write-Host "❌ Build failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host "🔍 Running linter..." -ForegroundColor Yellow
try {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        throw "Linting failed"
    }
} catch {
    Write-Host "❌ Linting failed. Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pre-deployment checks passed" -ForegroundColor Green

# Create deployment branch
$DeployBranch = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "🌿 Creating deployment branch: $DeployBranch" -ForegroundColor Yellow

git checkout -b $DeployBranch

# Deploy to Vercel preview
Write-Host "🚀 Deploying to Vercel preview..." -ForegroundColor Yellow

$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelInstalled) {
    $PreviewUrl = vercel --yes --confirm
    Write-Host "✅ Preview deployed to: $PreviewUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Vercel CLI not found. Please install with: npm i -g vercel" -ForegroundColor Yellow
    Write-Host "💡 Or deploy via Git push to see preview URL in GitHub" -ForegroundColor Yellow
    git push origin $DeployBranch
}

# Wait for user confirmation
Write-Host "🧪 Please test the preview environment thoroughly:" -ForegroundColor Yellow
Write-Host "  • Invoice creation"
Write-Host "  • PDF generation"
Write-Host "  • Validation messages"
Write-Host "  • Mobile responsiveness"
Write-Host "  • Database operations"
Write-Host ""

$confirmation = Read-Host "Has testing passed? Continue with production deployment? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "⏸️  Deployment cancelled. Cleaning up..." -ForegroundColor Yellow
    git checkout main
    git branch -D $DeployBranch
    exit 0
}

# Deploy to production
Write-Host "🎯 Deploying to production..." -ForegroundColor Yellow

# Merge to main and push
git checkout main
git pull origin main
git merge $DeployBranch --no-ff -m "Deploy: Enhanced validation display fixes"

# Tag the release
$Tag = "v$(Get-Date -Format 'yyyy.MM.dd')-validation-fixes"
git tag -a $Tag -m "Production deployment: Enhanced validation display"

# Push to production
git push origin main
git push origin $Tag

Write-Host "✅ Deployed to production!" -ForegroundColor Green

# Post-deployment monitoring reminder
Write-Host "📊 Post-deployment checklist:" -ForegroundColor Yellow
Write-Host "  • Monitor Vercel dashboard for errors"
Write-Host "  • Test invoice creation in production"
Write-Host "  • Verify PDF generation works"
Write-Host "  • Check validation message display"
Write-Host "  • Monitor for 30 minutes"

# Cleanup
git branch -D $DeployBranch

Write-Host "🎉 Blue-Green deployment completed successfully!" -ForegroundColor Green
Write-Host "💡 Rollback command if needed: git revert $Tag" -ForegroundColor Yellow 