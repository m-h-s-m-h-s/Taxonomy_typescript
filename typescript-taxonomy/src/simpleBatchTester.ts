/**
 * Simple batch testing utility for the Taxonomy Navigator.
 * 
 * This module provides a straightforward way to test multiple products
 * at once, displaying detailed stage-by-stage results for each product
 * to understand how the classification system works.
 * 
 * PURPOSE:
 * - Demonstrate the multi-stage classification process
 * - Test multiple products in sequence
 * - Show intermediate results for debugging
 * - Validate classification accuracy
 * 
 * OUTPUT FORMAT:
 * - Shows each stage's results with emojis
 * - Displays processing time and API calls
 * - Formats results in an easy-to-read layout
 * - Includes summary statistics at the end
 * 
 * USE CASES:
 * - Initial system testing after setup
 * - Regression testing after changes
 * - Demonstrating capabilities with examples
 * - Understanding classification decisions
 * 
 * DESIGN PHILOSOPHY:
 * - Hardcoded test products for consistency
 * - Verbose output for educational purposes
 * - Sequential processing for clarity
 * - Error handling with continuation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { TaxonomyNavigator } from './TaxonomyNavigator';
import { getApiKey } from './config';

/**
 * Array of test products covering different categories.
 * 
 * These products are carefully chosen to test various aspects:
 * - Electronics (TV, laptop, camera)
 * - Fashion (shoes, lipstick)
 * - Home goods (coffee maker)
 * - Cross-category items
 * - Products with potential ambiguity
 * 
 * Each product string simulates real e-commerce descriptions
 * with brand names, specifications, and features.
 */
const testProducts = [
  "Samsung 65-inch QLED 4K Smart TV with Alexa Built-in",
  "Nike Air Max 270 React Men's Running Shoes",
  "MAC Cosmetics Ruby Woo Matte Lipstick",
  "Nespresso Vertuo Next Coffee and Espresso Machine",
  "Apple MacBook Pro 16-inch M3 Max Space Black",
  "Canon EOS R5 Mirrorless Camera Body Only"
];

/**
 * Formats a number as seconds with one decimal place.
 * 
 * @param ms - Time in milliseconds
 * @returns Formatted string like "2.3s"
 */
function formatTime(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Main function that runs the batch test.
 * 
 * PROCESS FLOW:
 * 1. Initialize TaxonomyNavigator
 * 2. Process each test product sequentially
 * 3. Display stage-by-stage results
 * 4. Show summary statistics
 * 
 * STAGE DISPLAY:
 * - Stage 0: AI-generated summary
 * - Stage 1: Selected L1 categories
 * - Stage 2A/2B: Leaf selections with batch info
 * - Stage 3: Final result
 * 
 * ERROR HANDLING:
 * - Continues processing remaining products on error
 * - Shows error details for debugging
 * - Includes failed products in summary
 * 
 * @example
 * ```bash
 * npm run test-simple
 * 
 * 🧪 SIMPLE BATCH TESTER
 * Testing 6 products...
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📦 PRODUCT 1 of 6
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * Input: Samsung 65-inch QLED 4K Smart TV...
 * 
 * 📝 STAGE 0: AI Summary
 * "Television (TV, flat-screen display)..."
 * 
 * 🎯 STAGE 1: Top Categories Selected
 * • Electronics
 * • Home & Garden
 * ...
 * ```
 */
async function runBatchTest() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Simple argument parsing
  const getArg = (flag: string, defaultValue?: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return defaultValue;
  };

  const hasFlag = (flag: string): boolean => args.includes(flag);

  // File configuration
  const defaultTaxonomy = path.join(__dirname, '..', '..', 'data', 'taxonomy.en-US.txt');
  const productsFile = args.find(arg => arg.endsWith('.txt')) || path.join(__dirname, '../tests/sample_products.txt');
  const taxonomyFile = getArg('--taxonomy-file', defaultTaxonomy) || defaultTaxonomy;
  
  // Model configuration
  const model = getArg('--model', 'gpt-4.1-nano');
  const apiKey = getArg('--api-key');
  
  // Display options
  const showStagePaths = hasFlag('--show-stage-paths');
  const verbose = hasFlag('--verbose');

  // Check if running directly (no command line args) - show stage paths by default
  let showStagePathsDefault = false;
  let verboseDefault = false;
  let numProducts: number | null = null;

  if (args.length === 0) {
    // Running directly - enable stage display by default
    console.log('🔍 Running in direct mode - showing AI selections at each stage by default');
    console.log('='.repeat(80));
    showStagePathsDefault = true;
    verboseDefault = false;
    
    // Ask user how many products to run
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise<string>((resolve) => {
      rl.question('\n🎯 How many products would you like to test? ', resolve);
    });
    rl.close();
    
    try {
      numProducts = parseInt(answer);
      if (numProducts <= 0) {
        console.log('❌ Number must be greater than 0. Using 1.');
        numProducts = 1;
      }
    } catch {
      console.log('❌ Invalid input. Using 1 product.');
      numProducts = 1;
    }
    
    console.log(`🎲 Will randomly select ${numProducts} product(s) from the sample file`);
    console.log('='.repeat(80));
  }

  // Override show_stage_paths if running directly
  const shouldShowStagePaths = args.length === 0 ? showStagePathsDefault : showStagePaths;
  const shouldBeVerbose = args.length === 0 ? verboseDefault : verbose;

  // Configure logging based on verbose flag
  if (!shouldBeVerbose) {
    // Suppress logging
    console.debug = () => {};
    console.info = () => {};
    console.warn = () => {};
  }

  try {
    // Validate and get API key
    const resolvedApiKey = getApiKey(apiKey);
    if (!resolvedApiKey) {
      console.error('❌ Error: OpenAI API key not provided.');
      console.log('💡 Please set it in data/api_key.txt, environment variable OPENAI_API_KEY, or use --api-key');
      process.exit(1);
    }

    // Check if products file exists
    if (!fs.existsSync(productsFile)) {
        console.error(`❌ Products file not found: ${productsFile}`);
        return;
    }

    // Check if taxonomy file exists
    if (!fs.existsSync(taxonomyFile)) {
        console.error(`❌ Taxonomy file not found: ${taxonomyFile}`);
        console.log('\nPlease download the taxonomy file from:');
        console.log('https://support.google.com/merchants/answer/6324436');
        console.log(`and save it to: ${path.join(__dirname, '../data/taxonomy.en-US.txt')}`);
        return;
    }

    // Initialize the taxonomy navigator
    const navigator = new TaxonomyNavigator({
      taxonomyFile,
      apiKey: resolvedApiKey,
      model,
      enableLogging: shouldBeVerbose
    });

    // Read products from file
    const products = testProducts;
    
    if (products.length === 0) {
      console.log('❌ No products found in the file.');
      process.exit(1);
    }

    // If running in direct mode, randomly select the specified number of products
    let selectedProducts: string[];
    if (args.length === 0 && numProducts !== null) {
      if (numProducts >= products.length) {
        console.log(`📝 Note: Requested ${numProducts} products, but only ${products.length} available. Using all products.`);
        selectedProducts = products;
      } else {
        // Random selection without replacement
        selectedProducts = [];
        const indices = new Set<number>();
        while (indices.size < numProducts) {
          indices.add(Math.floor(Math.random() * products.length));
        }
        selectedProducts = Array.from(indices).map(i => products[i]);
        console.log(`🎲 Randomly selected ${selectedProducts.length} products from ${products.length} total`);
      }
    } else {
      // Use all products when run with command line arguments
      selectedProducts = products;
    }

    console.log(`\n🚀 Starting Classification Process...`);
    console.log(`   Total Products: ${selectedProducts.length}`);
    console.log(`   Taxonomy Categories: ~5,000+ options to choose from`);
    console.log('='.repeat(80));

    // Process each selected product and display in the requested format
    for (let i = 0; i < selectedProducts.length; i++) {
      const productLine = selectedProducts[i];
      
      // Show Stage paths for every product if requested (not just the first one)
      const showPaths = shouldShowStagePaths;
      
      if (showPaths) {
        console.log(`\n${'='.repeat(20)} PRODUCT ${i + 1} of ${selectedProducts.length} ${'='.repeat(20)}`);
        console.log('\n📦 PRODUCT DESCRIPTION:');
        const displayText = productLine.length > 100 
          ? `   Full: ${productLine.substring(0, 100)}...`
          : `   Full: ${productLine}`;
        console.log(displayText);
        console.log('   AI will generate a 40-60 word summary for all categorization stages');
        console.log('='.repeat(100));
      }

      // Classify the product
      const finalLeaf = await classifyProductWithStageDisplay(navigator, productLine, showPaths);

      // Display in the exact format requested: [Input] then Leaf Category
      console.log('\n[PRODUCT INPUT]');
      console.log(productLine);
      console.log('\n[FINAL CATEGORY]');
      console.log(finalLeaf);

      // More prominent separation between products
      if (i < selectedProducts.length - 1) { // Don't add separator after the last product
        console.log('\n' + '='.repeat(100) + '\n');
      }
    }

  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

/**
 * Read products from a text file, one product per line
 */
function readProductsFile(filename: string): string[] {
  try {
    const content = fs.readFileSync(filename, 'utf-8');
    // Read all lines, strip whitespace, and filter out empty lines
    return content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  } catch (error) {
    console.error(`Error: Products file '${filename}' not found.`);
    process.exit(1);
  }
}

/**
 * Extract the product title from a product description line
 */
function extractProductTitle(productLine: string): string {
  if (productLine.includes(':')) {
    // Split on first colon and return the title part
    return productLine.split(':', 1)[0].trim();
  } else {
    // No colon found, return the entire line as title
    return productLine.trim();
  }
}

/**
 * Classify a single product and optionally display the AI's selections at each stage
 */
async function classifyProductWithStageDisplay(
  navigator: TaxonomyNavigator,
  productLine: string,
  showStagePaths: boolean = false
): Promise<string> {
  try {
    if (showStagePaths) {
      console.log('\n🔍 CLASSIFICATION PROCESS VISUALIZATION');
      console.log('='.repeat(80));

      // Access the navigator's internal methods for stage display
      // Note: In a production system, you might want to expose these as public methods
      const navigatorAny = navigator as any;

      // First generate the AI summary
      console.log('\n📝 GENERATING AI SUMMARY');
      const summary = await navigatorAny.generateProductSummary(productLine);
      // Wrap the summary nicely
      const wrappedSummary = wrapText(summary, 70, '   ');
      console.log(wrappedSummary);

      // Stage 1: Get the AI's top 2 L1 taxonomy selections
      console.log('\n📋 STAGE 1: Identifying Main Product Categories');
      const allPaths = navigatorAny.allPaths;
      const uniqueL1s = [...new Set(allPaths.filter((p: any) => p.isLeaf).map((p: any) => p.parts[0]))];
      console.log(`   Goal: Pick 2 broad categories from all ${uniqueL1s.length} options`);

      const selectedL1s = await navigatorAny.stage1SelectL1Categories(summary);

      console.log(`\n   ✅ AI Selected ${selectedL1s.length} Main Categories:`);
      selectedL1s.forEach((l1: string, i: number) => {
        console.log(`      ${i + 1}. ${l1}`);
      });

      // Stage 2A: Show first leaf selection from chosen L1 taxonomies
      console.log(`\n📋 STAGE 2A: Finding Specific Categories in '${selectedL1s[0] || 'None'}'`);
      console.log('   Goal: Select specific product categories (up to 15 per batch)');

      const selectedLeaves2A = await navigatorAny.stage2SelectLeaves(summary, selectedL1s, [], 'Stage 2A');

      if (selectedLeaves2A.length > 0) {
        console.log(`\n   ✅ Found ${selectedLeaves2A.length} Relevant Categories:`);
        selectedLeaves2A.slice(0, 10).forEach((leaf: string, i: number) => {
          console.log(`      ${i + 1}. ${leaf}`);
        });
        if (selectedLeaves2A.length > 10) {
          console.log(`      ... and ${selectedLeaves2A.length - 10} more`);
        }
      } else {
        console.log(`\n   ⚠️ No specific categories found in '${selectedL1s[0]}' section`);
      }

      // Stage 2B: Show second leaf selection (only if 2 L1s were selected)
      let selectedLeaves2B: string[] = [];
      if (selectedL1s.length >= 2) {
        console.log(`\n📋 STAGE 2B: Finding Specific Categories in '${selectedL1s[1]}'`);
        console.log('   Goal: Select specific product categories (up to 15 per batch)');

        selectedLeaves2B = await navigatorAny.stage2SelectLeaves(summary, selectedL1s.slice(1), selectedLeaves2A, 'Stage 2B');

        if (selectedLeaves2B.length > 0) {
          console.log(`\n   ✅ Found ${selectedLeaves2B.length} Additional Categories:`);
          selectedLeaves2B.slice(0, 10).forEach((leaf: string, i: number) => {
            console.log(`      ${i + 1}. ${leaf}`);
          });
          if (selectedLeaves2B.length > 10) {
            console.log(`      ... and ${selectedLeaves2B.length - 10} more`);
          }
        } else {
          console.log(`\n   ⚠️ No specific categories found in '${selectedL1s[1]}' section`);
        }
      } else {
        console.log('\n📋 STAGE 2B: SKIPPED');
        console.log('   Reason: Only 1 main category was selected, no need to check a second');
      }

      // Combine all Stage 2 results
      const allSelectedLeaves = [...selectedLeaves2A, ...selectedLeaves2B];

      // Stage 3 info
      if (allSelectedLeaves.length === 0) {
        console.log('\n📋 STAGE 3: CANNOT PROCEED');
        console.log('   Reason: No specific categories were found');
        console.log('='.repeat(80));
        return 'False';
      } else if (allSelectedLeaves.length === 1) {
        console.log('\n📋 STAGE 3: SKIPPED - Using Single Result');
        console.log('   Reason: Only 1 category found, no need to choose');
        console.log(`   🎯 Final Category: ${allSelectedLeaves[0]}`);
        console.log('='.repeat(80));
        
        // Get the full path for this single result
        const matchingPath = allPaths.find((p: any) => 
          p.isLeaf && p.parts[p.parts.length - 1] === allSelectedLeaves[0]
        );
        if (matchingPath) {
          console.log('\n🎯 FINAL CLASSIFICATION RESULT:');
          console.log(`   Full Category Path: ${matchingPath.parts.join(' > ')}`);
          console.log(`   Product Category: ${allSelectedLeaves[0]}`);
        }
        return allSelectedLeaves[0];
      } else {
        console.log('\n📋 STAGE 3: Making Final Decision');
        console.log(`   Goal: Choose the single best category from ${allSelectedLeaves.length} options`);
        console.log('   Note: Using AI-generated summary for consistency across all stages');

        // Call stage 3 to make the final selection
        const bestIdx = await navigatorAny.stage3FinalSelection(summary, allSelectedLeaves);
        if (bestIdx >= 0) {
          const selectedLeaf = allSelectedLeaves[bestIdx];
          console.log('\n🎯 FINAL CLASSIFICATION RESULT:');
          // Get the full path for the selected leaf
          const matchingPath = allPaths.find((p: any) => 
            p.isLeaf && p.parts[p.parts.length - 1] === selectedLeaf
          );
          if (matchingPath) {
            console.log(`   Full Category Path: ${matchingPath.parts.join(' > ')}`);
            console.log(`   Product Category: ${selectedLeaf}`);
          }
          console.log('='.repeat(80));
          return selectedLeaf;
        } else {
          console.log('\n❌ STAGE 3 FAILED');
          console.log('   Reason: AI could not select from the options');
          console.log('='.repeat(80));
          return 'False';
        }
      }
    } else {
      // Non-verbose mode - just do the classification
      const result = await navigator.classifyProduct(productLine);
      
      if (!result.success) {
        return 'False';
      } else {
        return result.leafCategory;
      }
    }
  } catch (error) {
    // Return error indicator for any classification failures
    return `Error: ${String(error).substring(0, 30)}...`;
  }
}

/**
 * Wrap text to fit within a specified width
 */
function wrapText(text: string, width: number, indent: string = ''): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = indent;

  for (const word of words) {
    if ((currentLine + word).length > width) {
      lines.push(currentLine.trim());
      currentLine = indent + word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }
  
  return lines.join('\n');
}

// Run if executed directly
if (require.main === module) {
  runBatchTest().catch(console.error);
} 