#!/usr/bin/env node

/**
 * Test random products from the sample dataset
 * 
 * Usage: node scripts/test-random-products.js [number]
 * Example: node scripts/test-random-products.js 5
 */

const { TaxonomyNavigator } = require('../dist/TaxonomyNavigator');

// Sample products from tests/sample_products.txt
const testProducts = [
  {
    name: 'Microsoft Surface Laptop Go Computer',
    description: 'Microsoft Surface Laptop Go 8GB/256GB 12.4-inch Touchscreen Laptop with 10th Gen Intel Core i5-1035G1 Processor, Windows 10 Home in S mode.'
  },
  {
    name: 'Microsoft Xbox Controllers',
    description: 'Microsoft Xbox Wireless Bluetooth Controllers with USB, Carbon Black, 2-Pack. Compatible with Xbox Series X/S, Xbox One, PC, Android, and iOS.'
  },
  {
    name: 'Aesop Hand Soap',
    description: "Reverence Aromatique Hand Wash with finely milled pumice, vetiver root, petitgrain, and bergamot rind for gentle exfoliation and deep cleansing."
  },
  {
    name: 'iPhone 14 Pro Smartphone',
    description: 'Apple iPhone 14 Pro with 6.1-inch Super Retina XDR display featuring ProMotion technology with adaptive refresh rates up to 120Hz. Powered by A16 Bionic chip.'
  },
  {
    name: 'Sony WH-1000XM5 Wireless Headphones',
    description: 'Premium noise-canceling over-ear headphones with industry-leading noise cancellation technology. Features 30mm drivers with up to 30 hours battery life.'
  },
  {
    name: 'KitchenAid Stand Mixer',
    description: 'KitchenAid Artisan Series 5-Quart Tilt-Head Stand Mixer with 10 speeds and planetary mixing action. 325-watt motor handles heavy mixtures with ease.'
  },
  {
    name: 'Nike Air Max 270 Sneakers',
    description: "Men's lifestyle sneakers featuring Nike's largest heel Air unit for maximum comfort and impact protection. Engineered mesh upper provides breathability."
  },
  {
    name: 'Samsung 65-inch QLED 4K Smart TV',
    description: 'Samsung QN65Q80C 65-inch Neo QLED 4K Smart TV with Quantum HDR 24x and Direct Full Array backlighting. Powered by Neural Quantum Processor 4K.'
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: '6-quart multi-use programmable pressure cooker that replaces 7 kitchen appliances. Functions include pressure cooker, slow cooker, rice cooker, and more.'
  },
  {
    name: "Levi's 501 Original Fit Jeans",
    description: 'Classic straight-leg jeans with button fly and original fit through seat and thigh. Made from 100% cotton denim with no stretch for authentic vintage feel.'
  },
  {
    name: 'Dyson V15 Detect Cordless Vacuum',
    description: 'Cordless stick vacuum with laser dust detection technology and LCD screen showing particle count and size. Powered by Dyson Hyperdymium motor.'
  },
  {
    name: 'LEGO Creator Expert Taj Mahal',
    description: 'Detailed replica building set with 5,923 pieces for advanced builders ages 16+. Measures over 16 inches high when completed.'
  },
  {
    name: 'Canon EOS R6 Mark II Camera',
    description: 'Full-frame mirrorless camera with 24.2MP CMOS sensor and DIGIC X image processor. Features 4K 60p video recording with 10-bit internal recording.'
  },
  {
    name: 'Patagonia Better Sweater Fleece Jacket',
    description: 'Classic full-zip fleece jacket made from 100% recycled polyester fleece. Features stand-up collar and zippered handwarmer pockets.'
  },
  {
    name: 'Barbie Dreamhouse Dollhouse',
    description: 'Three-story dollhouse with 10 rooms including kitchen, bathroom, bedroom, and rooftop pool. Features working elevator, lights, and sounds.'
  },
  {
    name: 'Hot Wheels Track Builder Unlimited',
    description: 'Motorized track set with triple loop-the-loop action and booster. Includes 16+ feet of orange track pieces and connectors.'
  },
  {
    name: 'Nerf Elite 2.0 Commander Blaster',
    description: 'Foam dart blaster with 6-dart rotating drum and tactical rail accessories. Fires darts up to 90 feet with pump-action priming.'
  },
  {
    name: 'DeWalt 20V MAX Cordless Drill',
    description: 'Professional-grade cordless drill with brushless motor and 20V lithium-ion battery. Features 2-speed transmission with high-performance motor.'
  },
  {
    name: 'Milwaukee M18 FUEL Circular Saw',
    description: '18V cordless circular saw with brushless motor technology. 7-1/4 inch blade capacity cuts 2-9/16 inches at 90 degrees.'
  },
  {
    name: 'Adidas Ultraboost 22 Running Shoes',
    description: "Women's running shoes with Boost midsole technology for energy return. Primeknit upper adapts to foot shape for comfort."
  },
  {
    name: 'Lululemon Align High-Rise Leggings',
    description: "Women's yoga leggings made from buttery-soft Nulu fabric. High-rise waistband sits above hip bones for coverage. Four-way stretch."
  },
  {
    name: 'Fenty Beauty Pro Filt\'r Foundation',
    description: 'Full-coverage liquid foundation with soft matte finish. Available in 50 shades to match diverse skin tones. Long-wearing formula resists heat and humidity.'
  },
  {
    name: 'Charlotte Tilbury Pillow Talk Lipstick',
    description: 'Matte revolution lipstick in universally flattering nude-pink shade. Enriched with peptides and antioxidants for lip care benefits.'
  },
  {
    name: 'Wilson Pro Staff Tennis Racket',
    description: 'Professional tennis racket with 97 square inch head size. 16x19 string pattern for spin generation. Perimeter weighting for stability and power.'
  },
  {
    name: 'Spalding NBA Official Basketball',
    description: 'Official size and weight basketball used in NBA games. Full-grain leather construction with deep channel design.'
  },
  {
    name: 'Yeti Rambler Tumbler',
    description: '20 oz stainless steel tumbler with double-wall vacuum insulation. Keeps drinks cold for 24+ hours or hot for 6+ hours.'
  },
  {
    name: 'Coleman Sundome Camping Tent',
    description: '4-person dome tent with easy setup in 10 minutes. WeatherTec system with welded floors and inverted seams.'
  },
  {
    name: 'Peloton Bike+',
    description: 'Indoor exercise bike with 23.8-inch rotating HD touchscreen. Live and on-demand cycling classes with world-class instructors.'
  },
  {
    name: 'Organic Valley Whole Milk',
    description: 'USDA organic whole milk from pasture-raised cows. No artificial hormones, antibiotics, or pesticides.'
  },
  {
    name: 'Honey Nut Cheerios Cereal',
    description: 'Whole grain oat cereal with real honey and natural almond flavor. Good source of fiber and essential vitamins.'
  }
];

// Function to get random products
function getRandomProducts(count) {
  const shuffled = [...testProducts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function classifyTestProducts() {
  console.log('🔍 Product Classification Test\n');
  console.log(`Total available products: ${testProducts.length}`);
  
  // Get count from command line arguments or default to 3
  const args = process.argv.slice(2);
  const requestedCount = args[0] ? parseInt(args[0]) : 3;
  
  if (isNaN(requestedCount) || requestedCount < 1) {
    console.log('❌ Please provide a valid number greater than 0');
    console.log('Usage: node scripts/test-random-products.js [number]');
    console.log('Example: node scripts/test-random-products.js 5');
    return;
  }
  
  const count = Math.min(requestedCount, testProducts.length);
  if (requestedCount > testProducts.length) {
    console.log(`⚠️  Only ${testProducts.length} products available. Classifying all of them.`);
  }
  
  // Get random products
  const selectedProducts = getRandomProducts(count);
  
  console.log(`\n✨ Randomly selected ${count} product${count > 1 ? 's' : ''} for classification\n`);
  console.log('Note: The system takes product name + description and generates AI summaries internally.\n');
  
  try {
    const navigator = new TaxonomyNavigator();
    
    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      console.log(`\n📦 Product ${i + 1}/${count}: ${product.name}`);
      console.log(`📝 Input Description: ${product.description.substring(0, 80)}...`);
      
      try {
        // classifyProduct takes a single string that combines name and description
        const productInfo = `${product.name}: ${product.description}`;
        const result = await navigator.classifyProduct(productInfo);
        
        console.log(`✅ Category: ${result.bestMatch}`);
        console.log(`📊 Processing Time: ${result.processingTime}ms`);
        console.log(`📞 API Calls: ${result.apiCalls}`);
        
        // Note: The summary is generated internally but not returned in the current interface
        console.log(`🎯 Leaf Category: ${result.leafCategory}`);
        
      } catch (error) {
        console.error(`❌ Error: ${error.message || 'Unknown error'}`);
      }
    }
    
    console.log('\n✨ Classification complete!');
    console.log('\nKey Points:');
    console.log('- You provide product name and description as a single string');
    console.log('- The system generates focused AI summaries automatically');
    console.log('- Each product is intelligently matched to Google\'s taxonomy');
    console.log(`- Cost per classification: ~$0.001-0.002`);
    console.log(`- Estimated total cost: ~$${(count * 0.0015).toFixed(4)}`);
  } catch (error) {
    console.error('❌ Failed to initialize TaxonomyNavigator:', error.message);
  }
}

// Run the example
classifyTestProducts().catch(console.error); 