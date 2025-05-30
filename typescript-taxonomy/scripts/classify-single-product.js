#!/usr/bin/env node

/**
 * Single Product Classification Script
 * 
 * This script allows you to quickly classify a single product from the command line.
 * It's useful for testing and one-off categorizations without using the interactive mode.
 * 
 * Usage:
 *   npm run classify -- "product description"
 *   OR
 *   node scripts/classify-single-product.js "product description"
 * 
 * Examples:
 *   npm run classify -- "iPhone 14 Pro with 256GB storage"
 *   npm run classify -- "Nike Air Max running shoes"
 *   npm run classify -- "KitchenAid stand mixer"
 * 
 * Output:
 *   - Category path (e.g., "Electronics > Computers > Laptops")
 *   - Processing time
 *   - Number of API calls made
 * 
 * Requirements:
 *   - OpenAI API key must be configured
 *   - Taxonomy file must be present in data/taxonomy.en-US.txt
 */

const path = require('path');
const { TaxonomyNavigator } = require('../dist/src/TaxonomyNavigator');
const { getApiKey } = require('../dist/src/config');

async function main() {
  // Get product from command line
  const product = process.argv[2];
  
  if (!product) {
    console.error('Usage: node classify-single-product.js "Product description"');
    console.error('Example: node classify-single-product.js "iPhone 14 Pro"');
    process.exit(1);
  }

  try {
    // Get API key
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Error: OpenAI API key not found.');
      console.error('Please set OPENAI_API_KEY environment variable or create data/api_key.txt');
      process.exit(1);
    }

    // Initialize navigator
    const navigator = new TaxonomyNavigator({
      taxonomyFile: path.join(__dirname, '..', 'data', 'taxonomy.en-US.txt'),
      apiKey,
      enableLogging: false
    });

    console.log(`Classifying: ${product}`);
    console.log('Processing...\n');

    // Classify the product
    const result = await navigator.classifyProduct(product);

    if (result.success) {
      console.log(`Category: ${result.leafCategory}`);
      console.log(`Full Path: ${result.bestMatch}`);
      console.log(`API Calls: ${result.apiCalls}`);
      console.log(`Time: ${result.processingTime}ms`);
    } else {
      console.log(`Classification failed: ${result.error}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 