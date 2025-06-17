#!/usr/bin/env node

/**
 * Production deployment script with aggressive cache busting
 * This ensures fresh builds and prevents caching issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting clean production deployment...\n');

// Step 1: Update build timestamp in branding config
console.log('📝 Updating build timestamp...');
const brandingPath = path.join(__dirname, '../src/config/branding.ts');
let brandingContent = fs.readFileSync(brandingPath, 'utf8');

// Update timestamp to current time
const currentTimestamp = Date.now();
brandingContent = brandingContent.replace(
  /_buildTimestamp: \d+/,
  `_buildTimestamp: ${currentTimestamp}`
);

// Update version with timestamp-based version
const version = `1.0.${Math.floor(currentTimestamp / 1000)}`;
brandingContent = brandingContent.replace(
  /_version: "[^"]*"/,
  `_version: "${version}"`
);

// Update last updated timestamp
const isoTimestamp = new Date().toISOString();
brandingContent = brandingContent.replace(
  /_lastUpdated: "[^"]*"/,
  `_lastUpdated: "${isoTimestamp}"`
);

fs.writeFileSync(brandingPath, brandingContent);
console.log(`✅ Updated build timestamp: ${currentTimestamp}`);
console.log(`✅ Updated version: ${version}\n`);

// Step 2: Clean build artifacts
console.log('🧹 Cleaning build artifacts...');
try {
  execSync('rm -rf .next', { stdio: 'inherit' });
  execSync('rm -rf .vercel', { stdio: 'inherit' });
  console.log('✅ Cleaned .next and .vercel directories\n');
} catch (error) {
  console.log('⚠️  Some cleanup failed (this is normal on Windows)\n');
}

// Step 3: Install dependencies (ensure fresh)
console.log('📦 Installing dependencies...');
execSync('npm ci', { stdio: 'inherit' });
console.log('✅ Dependencies installed\n');

// Step 4: Build locally to verify
console.log('🔨 Building locally...');
execSync('npm run build', { stdio: 'inherit' });
console.log('✅ Local build successful\n');

// Step 5: Deploy to production
console.log('🚀 Deploying to production...');
execSync('vercel --prod --force', { stdio: 'inherit' });
console.log('✅ Production deployment complete!\n');

// Step 6: Show completion info
console.log('🎉 Deployment completed with cache busting!');
console.log('📊 Deployment info:');
console.log(`   • Build Timestamp: ${currentTimestamp}`);
console.log(`   • Version: ${version}`);
console.log(`   • Last Updated: ${isoTimestamp}`);
console.log('\n💡 To verify no caching issues:');
console.log('   1. Open your production URL in incognito mode');
console.log('   2. Check browser console for branding log message');
console.log('   3. Verify the timestamp matches this deployment'); 