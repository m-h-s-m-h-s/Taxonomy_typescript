# 🚀 HOW TO USE THE TAXONOMY NAVIGATOR - SUPER SIMPLE GUIDE

This guide will walk you through EVERYTHING you need to know to use the Taxonomy Navigator. No prior experience needed!

## 📋 What This Program Does

The Taxonomy Navigator takes a **product name** and **description**, then:
1. Generates an AI summary of the product (40-60 words)
2. Intelligently categorizes it into Google's product taxonomy
3. Returns the best matching category path

You provide: `name` + `description` → System returns: `category` + `confidence` + `summary`

## 🛠️ STEP 1: Initial Setup (One-Time Only)

### Prerequisites
- Node.js installed (version 14 or higher)
- Your OpenAI API key (which you already provided: ✅)

### Installation Steps

1. **Open Terminal** and navigate to the project:
```bash
cd /Users/mhs/Documents/GitHub/Taxonomy_typescript/typescript-taxonomy
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build the TypeScript code**:
```bash
npm run build
```

That's it! Setup is complete. ✅

## 🎮 STEP 2: How to Use Each Feature

### Option A: Interactive Mode (Easiest Way to Start!)

This is the BEST way to understand how the system works.

**How to run:**
```bash
npm run interactive
```

**What happens:**
1. The program will prompt: `Enter product to classify (or 'quit' to exit):`
2. Type any product description, for example: `Samsung 65 inch smart TV`
3. Press Enter
4. Watch as the AI classifies your product step-by-step!
5. You'll see the final category and full path
6. It will ask for another product (type 'quit' to exit)

**Example session:**
```
🚀 Welcome to Taxonomy Navigator Interactive Interface!
📊 Loaded 5597 taxonomy categories

Enter product to classify (or 'quit' to exit): iPhone 14 Pro

🔍 Classifying: iPhone 14 Pro

✅ Classification Results:
   Category: Mobile Phones
   Full Path: Electronics > Communications > Telephony > Mobile Phones
   
⏱️  Processing time: 4.2 seconds
📊 API calls made: 5

Enter product to classify (or 'quit' to exit): quit
👋 Thank you for using Taxonomy Navigator!
```

### Option B: Batch Test Mode (See the Magic Behind the Scenes!)

This mode shows you EXACTLY how the AI narrows down from 5,597 categories to 1.

**How to run:**
```bash
npm run batch-test
```

**What happens:**
1. It will ask: `Enter number of products to test:`
2. Type a small number like `3` and press Enter
3. Watch the detailed 5-stage classification process for each product!

**What you'll see:**
```
Enter number of products to test: 2

Testing 2 random products from sample file...

==================================================
Product 1/2: iPhone 14 Pro: Latest Apple smartphone with A16 chip
==================================================

📝 STAGE 0 - AI Summary:
"Smartphone (mobile phone, cell phone). Mobile device for communication..."

🎯 STAGE 1 - Selecting 2 main categories from 21:
Selected: Electronics, Software

🔍 STAGE 2A - Searching in Electronics (339 categories):
Processing batch 1/4 (categories 1-100)...
Selected: Mobile Phones, Mobile Phone Accessories...

🎯 STAGE 3 - Final Selection:
Best match: Mobile Phones
Full path: Electronics > Communications > Telephony > Mobile Phones

✅ CLASSIFICATION COMPLETE
```

### Option C: Classify a Single Product (Quick One-Off)

**How to run:**
```bash
npm run classify -- "Your product description here"
```

**Example:**
```bash
npm run classify -- "Nike Air Max running shoes"
```

**Output:**
```
Classifying: Nike Air Max running shoes
Processing...

Category: Shoe
Full Path: Apparel & Accessories > Shoes
API Calls: 6
Time: 3842ms
```

### Option D: Analyze Multiple Products from a File

**How to run:**
```bash
npm run analyze-batch
```

This will:
1. Read products from `tests/sample_products.txt`
2. Classify each one
3. Save results to a JSON file
4. Show statistics

## 📊 Understanding the Output

Each classification result shows:

1. **Category**: The specific product category (e.g., "Mobile Phones")
2. **Full Path**: Complete hierarchy (e.g., "Electronics > Communications > Telephony > Mobile Phones")
3. **API Calls**: Number of AI requests made (usually 3-20)
4. **Time**: Processing time in milliseconds

## 🔧 Troubleshooting

### "Cannot find module" error
**Solution**: Run `npm run build` first

### "API key not found" error
**Solution**: Your API key is already set up! But if needed, check that `typescript-taxonomy/data/api_key.txt` exists

### "Rate limit" error
**Solution**: Wait a minute and try again (OpenAI limits requests per minute)

### Program seems stuck
**Solution**: Each classification takes 3-7 seconds. Be patient!

## 💡 Pro Tips

1. **Start with Interactive Mode** - It's the easiest way to understand the system
2. **Try Batch Test Mode with 1-3 products** - See the AI's decision process
3. **Use specific product descriptions** - "iPhone 14 Pro" works better than just "phone"
4. **The more detail, the better** - "Samsung 65-inch QLED Smart TV" is better than "TV"

## 🎯 Quick Command Reference

```bash
# Interactive mode (recommended for beginners)
npm run interactive

# Batch test with visualization (see how it works)
npm run batch-test

# Classify one product
npm run classify -- "product description"

# Analyze multiple products
npm run analyze-batch

# Run example code
npm start
```

## 📝 Example Products to Try

Copy and paste these into interactive mode:

- `iPhone 14 Pro with 256GB storage and triple camera system`
- `Nike Air Jordan basketball shoes size 10`
- `Instant Pot 8 quart pressure cooker`
- `LEGO Star Wars Millennium Falcon building set`
- `Pampers baby diapers size 3`
- `Samsung 65 inch QLED 4K Smart TV`
- `Blue Buffalo dog food for senior dogs`
- `Yoga mat 6mm thick non-slip exercise mat`
- `KitchenAid stand mixer 5 quart`
- `Harry Potter complete book collection hardcover`

## 🚨 IMPORTANT: Your API Key is Already Set Up!

Your OpenAI API key is saved in `typescript-taxonomy/data/api_key.txt`. You don't need to do anything else for authentication!

## 🎉 That's It!

You're ready to classify products! Start with `npm run interactive` and have fun exploring how AI categorizes different products.

Remember: Each classification costs about $0.001-0.002, so feel free to experiment! 

## Step-by-Step Examples

### Example 1: Basic Product Classification

```typescript
import { TaxonomyNavigator } from './src/TaxonomyNavigator';

async function classifyProduct() {
  const navigator = new TaxonomyNavigator();
  
  // You provide: product name and description
  const result = await navigator.categorizeProduct(
    'Dyson V15 Detect Cordless Vacuum',
    'Cordless stick vacuum with laser dust detection technology and LCD screen showing particle count. 60 minutes runtime, converts to handheld.'
  );
  
  // System returns: category, confidence, and AI-generated summary
  console.log('Category:', result.category);
  // Output: "Home & Garden > Household Appliances > Vacuums & Floor Care > Vacuums"
  
  console.log('Summary:', result.summary);
  // Output: "Dyson V15 Detect is a high-tech cordless stick vacuum featuring laser dust detection 
  // and LCD particle counter. With 60-minute runtime and handheld conversion capability, this 
  // advanced vacuum cleaner provides powerful, versatile cleaning for modern homes."
}
```

### Example 2: Processing Test Products

Using real products from our test data:

```typescript
// Fashion Product
const jeans = await navigator.categorizeProduct(
  "Levi's 501 Original Fit Jeans",
  "Classic straight-leg jeans with button fly and original fit through seat and thigh. Made from 100% cotton denim with no stretch."
);
console.log(jeans.category);
// Output: "Apparel & Accessories > Clothing > Pants > Jeans"

// Electronics Product  
const headphones = await navigator.categorizeProduct(
  'Sony WH-1000XM5 Wireless Headphones',
  'Premium noise-canceling over-ear headphones with 30-hour battery life. Features multipoint Bluetooth and speak-to-chat technology.'
);
console.log(headphones.category);
// Output: "Electronics > Audio > Audio Components > Headphones"

// Toy Product
const lego = await navigator.categorizeProduct(
  'LEGO Creator Expert Taj Mahal',
  'Detailed replica building set with 5,923 pieces for advanced builders ages 16+. Measures over 16 inches high when completed.'
);
console.log(lego.category);
// Output: "Toys & Games > Toys > Building Toys > Building Sets"
```

### Example 3: Batch Processing

Process multiple products from a file or database:

```typescript
// Sample products array (like from tests/sample_products.txt)
const products = [
  {
    name: 'Canon EOS R6 Mark II Camera',
    description: 'Full-frame mirrorless camera with 24.2MP sensor, 4K 60p video, and in-body stabilization.'
  },
  {
    name: 'Instant Pot Duo 7-in-1',
    description: '6-quart multi-use pressure cooker that replaces 7 kitchen appliances.'
  },
  {
    name: 'Nike Air Max 270 Sneakers',
    description: 'Men\'s lifestyle sneakers with Nike\'s largest heel Air unit for comfort.'
  }
];

// Process each product
for (const product of products) {
  const result = await navigator.categorizeProduct(product.name, product.description);
  console.log(`${product.name} → ${result.category}`);
}

// Output:
// Canon EOS R6 Mark II Camera → Electronics > Cameras & Optics > Cameras > Digital Cameras
// Instant Pot Duo 7-in-1 → Home & Garden > Kitchen & Dining > Kitchen Appliances > Pressure Cookers
// Nike Air Max 270 Sneakers → Apparel & Accessories > Shoes > Athletic Shoes
```

### Understanding the Output

The system returns a complete result object:

```typescript
interface ClassificationResult {
  category: string;        // The selected Google taxonomy path
  confidence: number;      // Confidence score (0-1)
  summary: string;         // AI-generated product summary
  allCandidates?: Array;   // Optional: all considered categories
  processingTime?: number; // Optional: time taken in ms
}
```

**Key Points:**
- The `summary` is auto-generated - you don't need to write it
- Higher confidence scores (>0.8) indicate strong matches
- The category path uses " > " as separator 