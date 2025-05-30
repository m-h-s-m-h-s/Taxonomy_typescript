import { TaxonomyNavigator } from './src/TaxonomyNavigator';

async function testProduct() {
  try {
    // Initialize the navigator
    const navigator = new TaxonomyNavigator({
      enableLogging: true  // Shows detailed progress
    });

    // Test product
    const testProduct = "Samsung 65-inch QLED 4K Smart TV with Alexa Built-in";
    
    console.log(`\n🧪 Testing product: "${testProduct}"`);
    console.log("=" .repeat(60));
    
    // Classify the product
    const result = await navigator.classifyProduct(testProduct);
    
    // Display results
    console.log("\n📊 CLASSIFICATION RESULTS:");
    console.log("=" .repeat(60));
    
    if (result.success) {
      console.log(`✅ Success!`);
      console.log(`🎯 Best Match: ${result.bestMatch}`);
      console.log(`🍃 Leaf Category: ${result.leafCategory}`);
      console.log(`⏱️  Processing Time: ${(result.processingTime / 1000).toFixed(1)} seconds`);
      console.log(`🔢 API Calls: ${result.apiCalls}`);
      console.log(`💰 Estimated Cost: $${(result.apiCalls * 0.0001).toFixed(4)}`);
      
      if (result.paths.length > 1) {
        console.log(`\n🔍 Other candidates considered:`);
        result.paths.slice(0, 5).forEach((path, i) => {
          if (i !== result.bestMatchIndex) {
            console.log(`   - ${path.join(' > ')}`);
          }
        });
      }
    } else {
      console.log(`❌ Classification failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error(`\n❌ Error: ${error}`);
    console.log("\n💡 Common issues:");
    console.log("   - Missing API key: Create data/api_key.txt");
    console.log("   - Missing taxonomy file: Ensure data/taxonomy.en-US.txt exists");
  }
}

// Run the test
testProduct(); 