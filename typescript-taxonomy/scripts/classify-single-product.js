#!/usr/bin/env node

/**
 * Classify Single Product Script
 * 
 * Simple script to classify a single product using the Taxonomy Navigator
 * 
 * Usage:
 *   node classify-single-product.js "Product description here"
 *   
 * Example:
 *   node classify-single-product.js "iPhone 14 Pro: Smartphone with advanced camera"
 */

const { TaxonomyNavigator } = require('../dist/TaxonomyNavigator');
const { getApiKey } = require('../dist/config');
const path = require('path');

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