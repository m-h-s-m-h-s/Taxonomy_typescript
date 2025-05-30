# 🎯 TAXONOMY NAVIGATOR - QUICK REFERENCE

## 🚀 Setup Commands (Run Once)
```bash
cd /Users/mhs/Documents/GitHub/Taxonomy_typescript/typescript-taxonomy
npm install
npm run build
```

## ✅ Check Setup
```bash
npm run check
```

## 🎮 Usage Commands

### Interactive Mode (Recommended!)
```bash
npm run interactive
```
Then type product descriptions when prompted.

### See How It Works
```bash
npm run batch-test
```
Enter a small number (like 2 or 3) to see the classification process.

### Test Random Products
```bash
npm run test-random      # Tests 3 random products
npm run test-random 5    # Tests 5 random products
npm run test-random 10   # Tests 10 random products
```

### Quick Classification
```bash
npm run classify -- "iPhone 14 Pro"
npm run classify -- "Nike running shoes"
npm run classify -- "Dog food for puppies"
```

### Batch Analysis
```bash
npm run analyze-batch
```

## 📝 Example Products to Copy/Paste

**Electronics:**
- `iPhone 14 Pro with 256GB storage`
- `Samsung 65 inch QLED Smart TV`
- `Sony WH-1000XM5 noise canceling headphones`
- `MacBook Pro 16 inch M2 Max`

**Fashion:**
- `Nike Air Jordan basketball shoes`
- `Levi's 501 original jeans`
- `Ray-Ban Aviator sunglasses`
- `North Face winter jacket`

**Home & Kitchen:**
- `Instant Pot 8 quart pressure cooker`
- `KitchenAid stand mixer`
- `Dyson V15 cordless vacuum`
- `Ninja professional blender`

**Toys & Games:**
- `LEGO Star Wars Millennium Falcon`
- `Nintendo Switch OLED console`
- `Monopoly board game`
- `Barbie Dream House playset`

**Pet Supplies:**
- `Blue Buffalo dog food senior formula`
- `Cat scratching post 48 inches`
- `Aquarium filter 50 gallon`
- `Hamster exercise wheel`

## 💰 Cost Reference
- Each classification: ~$0.001-0.002
- 1,000 products: ~$1-2
- 10,000 products: ~$10-20

## ⚡ Tips
- Be specific: "iPhone 14 Pro" > "phone"
- Add details: "Nike Air Max 270 running shoes" > "shoes"
- Include brand when relevant
- Each classification takes 3-7 seconds

## 🆘 Help
- Full guide: See `HOW_TO_USE.md`
- Technical docs: See `DEVELOPER_GUIDE.md`
- Your API key is in: `data/api_key.txt`

# Quick Reference Guide

## Basic Usage

```typescript
const navigator = new TaxonomyNavigator();

// Provide product name and description as a single string
// Format: "Product Name: Product description with details"
const result = await navigator.classifyProduct(
  'Product Name: Product description with details about features, specifications, etc.'
);

console.log(result.bestMatch);     // e.g., "Electronics > Computers > Laptops"
console.log(result.leafCategory);  // e.g., "Laptops"
console.log(result.processingTime); // e.g., 2451 (ms)
console.log(result.apiCalls);      // e.g., 5
```

## What You Need to Provide

The system requires a single string input combining:
- **Product Name** - The name/title of the product
- **Product Description** - Detailed description including features, specs, uses

Format: `"Product Name: Description"`

The system then:
- Automatically generates a focused AI summary (40-60 words)
- Uses this summary for intelligent categorization
- Returns the best matching Google taxonomy category

## Real Examples

```typescript
// Example 1: Electronics
const laptop = await navigator.classifyProduct(
  'Microsoft Surface Laptop Go: Lightweight 12.4" touchscreen laptop with Intel Core i5, 8GB RAM, 256GB SSD'
);
console.log(laptop.bestMatch);
// Returns: "Electronics > Computers > Laptops"

// Example 2: Sports Equipment  
const racket = await navigator.classifyProduct(
  'Wilson Pro Staff Tennis Racket: Professional racket with 97 sq inch head, 16x19 string pattern for spin'
);
console.log(racket.bestMatch);
// Returns: "Sporting Goods > Athletics > Racquet Sports > Tennis > Tennis Rackets"

// Example 3: Kitchen Appliance
const mixer = await navigator.classifyProduct(
  'KitchenAid Stand Mixer: 5-quart tilt-head mixer with 10 speeds, 325W motor, includes attachments'
);
console.log(mixer.bestMatch);
// Returns: "Home & Garden > Kitchen & Dining > Kitchen Appliances > Mixers"
``` 