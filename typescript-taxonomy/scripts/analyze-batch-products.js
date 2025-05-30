#!/usr/bin/env node

/**
 * Analyze Batch Products Script
 * 
 * Script to classify multiple products from a file and generate statistics
 * 
 * Usage:
 *   node analyze-batch-products.js [--file products.txt] [--output results.json]
 *   
 * Options:
 *   --file     Input file with products (one per line)
 *   --output   Output file for results (JSON format)
 *   --verbose  Show detailed progress
 */

const { TaxonomyNavigator } = require('../dist/TaxonomyNavigator');
const { getApiKey } = require('../dist/config');
const fs = require('fs');
const path = require('path');

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  
  const getArg = (flag, defaultValue) => {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return defaultValue;
  };
  
  const hasFlag = (flag) => args.includes(flag);
  
  // Configuration
  const inputFile = getArg('--file', path.join(__dirname, '..', 'tests', 'sample_products.txt'));
  const outputFile = getArg('--output', `batch_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const verbose = hasFlag('--verbose');
  
  try {
    // Get API key
    const apiKey = getApiKey();
    if (!apiKey) {
      console.error('Error: OpenAI API key not found.');
      console.error('Please set OPENAI_API_KEY environment variable or create data/api_key.txt');
      process.exit(1);
    }
    
    // Read products
    if (!fs.existsSync(inputFile)) {
      console.error(`Error: Input file '${inputFile}' not found.`);
      process.exit(1);
    }
    
    const products = fs.readFileSync(inputFile, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (products.length === 0) {
      console.error('Error: No products found in input file.');
      process.exit(1);
    }
    
    console.log(`📊 Batch Product Analysis`);
    console.log(`📁 Input: ${inputFile} (${products.length} products)`);
    console.log(`💾 Output: ${outputFile}`);
    console.log(`🚀 Starting classification...\n`);
    
    // Initialize navigator
    const navigator = new TaxonomyNavigator({
      taxonomyFile: path.join(__dirname, '..', 'data', 'taxonomy.en-US.txt'),
      apiKey,
      enableLogging: verbose
    });
    
    // Process products
    const results = [];
    let successful = 0;
    let failed = 0;
    let totalApiCalls = 0;
    let totalTime = 0;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (verbose) {
        console.log(`\n[${i + 1}/${products.length}] Classifying: ${product}`);
      } else {
        process.stdout.write(`\rProgress: ${i + 1}/${products.length} (${Math.round((i + 1) / products.length * 100)}%)`);
      }
      
      try {
        const result = await navigator.classifyProduct(product);
        
        results.push({
          product,
          success: result.success,
          category: result.leafCategory,
          fullPath: result.bestMatch,
          apiCalls: result.apiCalls,
          processingTime: result.processingTime,
          timestamp: new Date().toISOString()
        });
        
        if (result.success) {
          successful++;
          totalApiCalls += result.apiCalls;
          totalTime += result.processingTime;
          
          if (verbose) {
            console.log(`✅ Success: ${result.leafCategory}`);
          }
        } else {
          failed++;
          if (verbose) {
            console.log(`❌ Failed: ${result.error}`);
          }
        }
        
      } catch (error) {
        failed++;
        results.push({
          product,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        if (verbose) {
          console.error(`❌ Error: ${error.message}`);
        }
      }
      
      // Rate limiting pause
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms between requests
      }
    }
    
    if (!verbose) {
      console.log(''); // New line after progress
    }
    
    // Save results
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    
    // Display statistics
    console.log('\n📈 Results Summary:');
    console.log(`✅ Successful: ${successful} (${(successful / products.length * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed} (${(failed / products.length * 100).toFixed(1)}%)`);
    
    if (successful > 0) {
      console.log(`\n📊 Performance Metrics:`);
      console.log(`🔧 Total API calls: ${totalApiCalls}`);
      console.log(`⏱️  Average time per product: ${(totalTime / successful).toFixed(0)}ms`);
      console.log(`📞 Average API calls per product: ${(totalApiCalls / successful).toFixed(1)}`);
      
      // Category distribution
      const categoryCount = {};
      results.forEach(r => {
        if (r.success && r.category) {
          categoryCount[r.category] = (categoryCount[r.category] || 0) + 1;
        }
      });
      
      console.log(`\n🏷️  Top Categories:`);
      Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count} products`);
        });
    }
    
    console.log(`\n💾 Full results saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 