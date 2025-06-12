#!/usr/bin/env node

/**
 * Production Preparation Script
 * This script helps prepare the codebase for production deployment
 * by updating configurations and removing test markers.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing codebase for production deployment...\n');

// Files to update
const updates = [
  {
    file: 'package.json',
    description: 'Update package.json for production',
    update: (content) => {
      const pkg = JSON.parse(content);
      pkg.name = 'valerie-deleon-invoice-system';
      pkg.version = '1.0.0';
      pkg.description = 'Professional invoice management system for Valerie De Leon, CSR #13025';
      // Remove test keyword
      if (pkg.keywords) {
        pkg.keywords = pkg.keywords.filter(k => k !== 'test');
      }
      return JSON.stringify(pkg, null, 2);
    }
  },
  {
    file: 'src/config/branding.ts',
    description: 'Update branding configuration for production',
    update: (content) => {
      return content
        .replace(/\[TEST\]\s*/g, '')
        .replace(/\[TEST ENVIRONMENT\]\s*/g, '')
        .replace('"#EA580C"', '"#7C3AED"') // Orange to purple
        .replace('"#DC2626"', '"#059669"') // Red to green
        .replace('"TEST"', '"VDL"')
        .replace('Orange theme for test environment', 'Professional purple')
        .replace('Red accent for test visibility', 'Green accent for payment sections')
        .replace('Clear test indicator', 'Professional branding');
    }
  },
  {
    file: 'src/config/constants.ts',
    description: 'Update constants for production',
    update: (content) => {
      return content
        .replace('Test Court Reporter Services', 'Valerie De Leon, CSR #13025')
        .replace('123 Test Street, Test City, TX 12345', '126 Old Settlers Drive, San Marcos, TX 78666')
        .replace('test@example.com', 'valeriedeleon.csr@gmail.com')
        .replace('www.testcourtreporter.com', 'www.valeriedeleon-csr.com')
        .replace('"TEST"', '"VDL"')
        .replace('/signature-test.png', '/signature-production.png')
        .replace('process.env.TEST_DATABASE_URL ||', '')
        .replace('test_invoices', 'production_invoices');
    }
  }
];

// Backup original files
console.log('📁 Creating backups of original files...');
updates.forEach(({ file }) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`   ✓ Backed up ${file} to ${file}.backup`);
  }
});

console.log('\n🔧 Applying production updates...');

// Apply updates
let hasErrors = false;
updates.forEach(({ file, description, update }) => {
  try {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const updatedContent = update(content);
      fs.writeFileSync(filePath, updatedContent);
      console.log(`   ✓ ${description}`);
    } else {
      console.log(`   ⚠️  File not found: ${file}`);
    }
  } catch (error) {
    console.log(`   ❌ Error updating ${file}: ${error.message}`);
    hasErrors = true;
  }
});

console.log('\n📋 Manual steps still required:');
console.log('   1. Update src/components/MobileNavigation.tsx navigation title');
console.log('   2. Remove test banner from pages/index.tsx');
console.log('   3. Add production signature image to public/signature-production.png');
console.log('   4. Set up environment variables in Vercel dashboard');
console.log('   5. Verify phone number and website in branding config');

console.log('\n🔄 Next steps:');
console.log('   1. Review all changes: git diff');
console.log('   2. Test locally: npm run build && npm run start');
console.log('   3. Deploy: ./scripts/deploy-blue-green.sh');

if (hasErrors) {
  console.log('\n⚠️  Some errors occurred. Please review and fix manually.');
  process.exit(1);
} else {
  console.log('\n✅ Production preparation complete!');
}

console.log('\n📖 For complete deployment guide, see: PRODUCTION-DEPLOYMENT-GUIDE.md'); 