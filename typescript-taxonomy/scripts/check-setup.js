#!/usr/bin/env node

/**
 * Setup Checker Script
 * 
 * This script verifies that everything is set up correctly for using the Taxonomy Navigator
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Taxonomy Navigator Setup...\n');

let allGood = true;

// Check 1: Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 14) {
  console.log('✅ Node.js version:', nodeVersion);
} else {
  console.log('❌ Node.js version:', nodeVersion, '(Need version 14 or higher)');
  allGood = false;
}

// Check 2: Dependencies installed
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ Dependencies installed');
} else {
  console.log('❌ Dependencies not installed - Run: npm install');
  allGood = false;
}

// Check 3: TypeScript built
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ TypeScript compiled');
} else {
  console.log('❌ TypeScript not compiled - Run: npm run build');
  allGood = false;
}

// Check 4: Taxonomy file
const taxonomyPath = path.join(__dirname, '..', 'data', 'taxonomy.en-US.txt');
if (fs.existsSync(taxonomyPath)) {
  const stats = fs.statSync(taxonomyPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`✅ Taxonomy file found (${sizeMB} MB)`);
} else {
  console.log('❌ Taxonomy file not found');
  allGood = false;
}

// Check 5: API key
const apiKeyPath = path.join(__dirname, '..', 'data', 'api_key.txt');
const envKey = process.env.OPENAI_API_KEY;

if (fs.existsSync(apiKeyPath)) {
  const key = fs.readFileSync(apiKeyPath, 'utf-8').trim();
  if (key && key.startsWith('sk-')) {
    console.log('✅ API key found in data/api_key.txt');
  } else {
    console.log('⚠️  API key file exists but appears invalid');
    allGood = false;
  }
} else if (envKey) {
  console.log('✅ API key found in environment variable');
} else {
  console.log('❌ No API key found - Create data/api_key.txt or set OPENAI_API_KEY');
  allGood = false;
}

// Check 6: Sample products file
const samplePath = path.join(__dirname, '..', 'tests', 'sample_products.txt');
if (fs.existsSync(samplePath)) {
  const products = fs.readFileSync(samplePath, 'utf-8').split('\n').filter(l => l.trim()).length;
  console.log(`✅ Sample products file found (${products} products)`);
} else {
  console.log('⚠️  Sample products file not found (optional)');
}

// Final verdict
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Everything is set up correctly!');
  console.log('\n🚀 You can now run:');
  console.log('   npm run interactive     - Start interactive mode');
  console.log('   npm run batch-test      - See how it works');
  console.log('   npm run classify -- "iPhone 14"  - Quick classification');
} else {
  console.log('❌ Some issues need to be fixed.');
  console.log('\n📖 See HOW_TO_USE.md for detailed setup instructions');
}
console.log('='.repeat(50) + '\n'); 