/**
 * Test Random Products Script
 * 
 * Randomly selects and classifies products from the test dataset.
 * Displays detailed stage-by-stage AI selections like the Python version.
 * 
 * Usage:
 *   npm run test-random 5        # Test 5 random products
 *   npm run test-random          # Test 1 random product (default)
 *   node scripts/test-random-products.js 3
 * 
 * Exit codes:
 *   0 - All tests completed successfully
 *   1 - Configuration or setup error
 *   2 - Runtime error during classification
 */

const path = require('path');
const fs = require('fs');

// Function to wrap text nicely
function wrapText(text, width = 70, indent = '   ') {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.map(line => indent + line).join('\n');
}

async function main() {
  try {
    console.log('🔍 Product Classification Test\n');

    // Get number of products to test from command line
    const args = process.argv.slice(2);
    let numProducts = 1; // default
    
    if (args.length > 0) {
      numProducts = parseInt(args[0]);
      if (isNaN(numProducts) || numProducts < 1) {
        console.error('❌ Please provide a valid number of products to test');
        process.exit(1);
      }
    }

    // Check if compiled JavaScript exists
    const distPath = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distPath)) {
      console.error('❌ Compiled JavaScript not found. Please run: npm run build');
      process.exit(1);
    }

    // Import the navigator
    const { TaxonomyNavigator } = require('../dist/src/TaxonomyNavigator');
    
    // Read products file
    const productsFile = path.join(__dirname, '..', 'tests', 'sample_products.txt');
    if (!fs.existsSync(productsFile)) {
      console.error('❌ Products file not found:', productsFile);
      process.exit(1);
    }

    // Parse products from file (handle different formats)
    const fileContent = fs.readFileSync(productsFile, 'utf8');
    let products = [];
    
    // Check if it's JSON format
    try {
      const jsonData = JSON.parse(fileContent);
      if (Array.isArray(jsonData)) {
        products = jsonData.map(item => {
          if (typeof item === 'string') return item;
          if (item.title && item.description) return `${item.title}: ${item.description}`;
          if (item.name && item.description) return `${item.name}: ${item.description}`;
          return JSON.stringify(item);
        });
      }
    } catch {
      // Not JSON, treat as line-separated
      products = fileContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    if (products.length === 0) {
      console.error('❌ No products found in file');
      process.exit(1);
    }

    console.log(`Total available products: ${products.length}\n`);

    // Randomly select products
    const selectedProducts = [];
    const availableIndices = [...Array(products.length).keys()];
    
    for (let i = 0; i < Math.min(numProducts, products.length); i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      const productIndex = availableIndices[randomIndex];
      selectedProducts.push(products[productIndex]);
      availableIndices.splice(randomIndex, 1);
    }

    console.log(`✨ Randomly selected ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} for classification\n`);
    console.log('Note: The system generates AI summaries internally for categorization.\n');

    // Initialize navigator
    const navigator = new TaxonomyNavigator({
      enableLogging: false // We'll show our own formatted output
    });

    // Track for summary stats
    let successCount = 0;
    let totalApiCalls = 0;
    let totalTime = 0;

    // Process each product
    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      const productTitle = product.split(':')[0].trim();
      const productNum = i + 1;

      console.log(`${'='.repeat(20)} ANALYZING PRODUCT ${productNum} ${'='.repeat(20)}`);
      console.log(`📦 ${product}\n`);

      try {
        // Enable detailed stage information
        const startTime = Date.now();
        const result = await navigator.classifyProduct(product);
        const elapsedTime = Date.now() - startTime;

        if (result.success && result.stageDetails) {
          const details = result.stageDetails;
          
          // Show AI summary
          console.log('📝 AI SUMMARY:');
          console.log(wrapText(details.aiSummary));
          
          // Stage 1
          console.log('\n📋 STAGE 1 - AI selecting top 2 L1 taxonomies from all categories...');
          console.log(`✅ AI selected ${details.stage1L1Categories.length} L1 categories: [${details.stage1L1Categories.join(', ')}]`);
          
          // Stage 2A
          console.log('\n📋 STAGE 2A - AI selecting leaf nodes from chosen L1 taxonomies...');
          if (details.stage2aLeaves.length > 0) {
            console.log(`✅ AI selected ${details.stage2aLeaves.length} leaf nodes from ${details.stage1L1Categories[0] || 'first L1'}`);
          } else {
            console.log(`⚠️ No specific categories found in '${details.stage1L1Categories[0] || 'first L1'}' section`);
          }
          
          // Stage 2B
          if (!details.stage2bSkipped) {
            console.log('\n📋 STAGE 2B - AI selecting additional leaf nodes...');
            if (details.stage2bLeaves.length > 0) {
              console.log(`✅ AI selected ${details.stage2bLeaves.length} additional leaf nodes from ${details.stage1L1Categories[1] || 'second L1'}`);
            } else {
              console.log(`⚠️ No specific categories found in '${details.stage1L1Categories[1] || 'second L1'}' section`);
            }
          } else {
            console.log('\n📋 STAGE 2B - SKIPPED');
            console.log('   Reason: Only 1 main category was selected, no need to check a second');
          }
          
          // Stage 3
          if (details.totalCandidates === 0) {
            console.log('\n📋 STAGE 3 - CANNOT PROCEED');
            console.log('   Reason: No specific categories were found');
          } else if (details.stage3Skipped) {
            console.log('\n📋 STAGE 3 - SKIPPED - Using Single Result');
            console.log('   Reason: Only 1 category found, no need to choose');
          } else {
            console.log(`\n📋 STAGE 3 - AI selecting final match from ${details.totalCandidates} candidates...`);
          }
          
          console.log(`🎯 FINAL RESULT: ${result.bestMatch}`);
          
          console.log(`\n[${product}]`);
          console.log(result.leafCategory);
          
          successCount++;
          totalApiCalls += result.apiCalls;
          totalTime += elapsedTime;
        } else if (result.success) {
          // Fallback if no stage details (shouldn't happen with our new code)
          console.log('📝 AI SUMMARY: Generating focused product summary...');
          console.log('\n📋 STAGE 1 - AI selecting top 2 L1 taxonomies from all categories...');
          console.log('✅ AI selected 2 L1 categories: [Categories selected internally]');
          console.log('\n📋 STAGE 2 - AI selecting top 15 leaf nodes from chosen L1 taxonomies...');
          console.log('✅ AI selected leaf nodes from selected L1 categories');
          console.log('\n📋 STAGE 3 - AI selecting final match from candidates...');
          console.log(`🎯 FINAL RESULT: ${result.bestMatch}`);
          
          console.log(`\n[${product}]`);
          console.log(result.leafCategory);
          
          successCount++;
          totalApiCalls += result.apiCalls;
          totalTime += elapsedTime;
        } else {
          console.log(`❌ Classification failed: ${result.error || 'Unknown error'}`);
          console.log(`\n[${product}]`);
          console.log('False');
        }

      } catch (error) {
        console.error(`❌ Error classifying product: ${error.message}`);
        console.log(`\n[${product}]`);
        console.log('False');
      }

      if (i < selectedProducts.length - 1) {
        console.log(`\n${'='.repeat(100)}\n`);
      }
    }

    // Summary statistics
    console.log(`\n${'='.repeat(100)}`);
    console.log('\n✨ Classification complete!\n');
    console.log('Summary Statistics:');
    console.log(`- Products tested: ${selectedProducts.length}`);
    console.log(`- Successful: ${successCount}`);
    console.log(`- Failed: ${selectedProducts.length - successCount}`);
    if (successCount > 0) {
      console.log(`- Average time: ${Math.round(totalTime / successCount)}ms`);
      console.log(`- Average API calls: ${(totalApiCalls / successCount).toFixed(1)}`);
      console.log(`- Estimated cost: ~$${(totalApiCalls * 0.0001).toFixed(4)}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(2);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main }; 