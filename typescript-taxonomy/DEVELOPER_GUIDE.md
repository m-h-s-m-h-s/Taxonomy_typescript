# Developer Guide - TypeScript Taxonomy Navigator

## 🎯 Overview

This is a TypeScript implementation of an AI-powered product categorization system that classifies products into Google Product Taxonomy categories (5,000+ categories) using OpenAI's GPT models.

## 🏗️ Architecture

### Core Components

#### 1. **TaxonomyNavigator** (`src/TaxonomyNavigator.ts`)
The main classification engine that implements the 5-stage process:

```typescript
const navigator = new TaxonomyNavigator({
  taxonomyFile: './data/taxonomy.en-US.txt',
  apiKey: 'your-api-key',
  enableLogging: true
});

const result = await navigator.classifyProduct('iPhone 14 Pro');
```

**Key Methods:**
- `generateProductSummary()` - Creates 40-60 word AI summary
- `stage1SelectL1Categories()` - Selects 2 main categories
- `stage2SelectLeaves()` - Batch processes specific categories
- `stage3FinalSelection()` - Makes final choice
- `classifyProduct()` - Main entry point

#### 2. **Configuration** (`src/config.ts`)
Manages API keys with fallback hierarchy:

```typescript
const apiKey = getApiKey(); // Checks: arg → env → file
validateApiKeyFormat(apiKey); // Validates sk- format
setupApiKeyFile(apiKey); // Creates api_key.txt
```

#### 3. **Interactive Interface** (`src/interactiveInterface.ts`)
CLI for interactive product classification:

```typescript
const interface = new TaxonomyInterface();
await interface.run(); // Starts interactive session
```

#### 4. **Batch Tester** (`src/simpleBatchTester.ts`)
Test tool with stage visualization:

```typescript
await classifyProductWithStageDisplay(navigator, product, true);
```

## 🔄 Classification Process

### Stage 0: AI Summary Generation
```typescript
// Generates focused summary for categorization
const summary = await generateProductSummary("Full product description...");
// Output: "Television (TV). 65-inch display for viewing video content..."
```

### Stage 1: L1 Category Selection
```typescript
// Selects 2 from ~21 top-level categories
const l1Categories = await stage1SelectL1Categories(summary);
// Output: ["Electronics", "Home & Garden"]
```

### Stage 2: Leaf Node Selection (Batch Processing)
```typescript
// Processes in batches of 100, up to 15 selections per batch
const leaves = await stage2SelectLeaves(summary, l1Categories, [], 'Stage 2A');
// Output: ["Televisions", "TV Mounts", "Remote Controls", ...]
```

### Stage 3: Final Selection
```typescript
// Chooses best match from all candidates
const bestIndex = await stage3FinalSelection(summary, allLeaves);
// Output: Index of "Televisions"
```

## 🛡️ Anti-Hallucination Measures

### 1. **Numeric Selection**
Instead of returning text, AI returns numbers:
```typescript
// ❌ Bad: AI returns "Television" (might be misspelled)
// ✅ Good: AI returns "315" (index of Televisions)
```

### 2. **Batch Processing**
Ensures all categories are accessible:
```typescript
// Electronics has 339 categories
// Processed in 4 batches of 100 each
// Category at position 315 is reachable
```

### 3. **Validation at Every Stage**
```typescript
// Stage 1: Validates L1 exists
if (!l1Categories.includes(selected)) {
  logger.error(`HALLUCINATION: ${selected} not in taxonomy`);
}

// Stage 3: Validates numeric response
if (number < 1 || number > options.length) {
  return -1; // Failure
}
```

## 📦 Installation & Setup

### 1. Install Dependencies
```bash
npm install
# or manually add to package.json:
# "openai": "^4.0.0"
# "dotenv": "^16.0.0"
```

### 2. Set API Key
```bash
# Option 1: Environment variable
export OPENAI_API_KEY=sk-your-key

# Option 2: Create file
echo "sk-your-key" > data/api_key.txt

# Option 3: Pass to constructor
new TaxonomyNavigator({ apiKey: 'sk-your-key' })
```

### 3. Build TypeScript
```bash
npm run build
```

## 🚀 Usage Examples

### Basic Classification
```typescript
import { TaxonomyNavigator } from './src/TaxonomyNavigator';

const navigator = new TaxonomyNavigator({
  taxonomyFile: './data/taxonomy.en-US.txt',
  apiKey: process.env.OPENAI_API_KEY
});

const result = await navigator.classifyProduct(
  'Samsung 65-inch QLED Smart TV with 4K resolution'
);

console.log(result.leafCategory); // "Televisions"
console.log(result.bestMatch); // "Electronics > Video > Televisions"
```

### Batch Processing
```typescript
const products = [
  'iPhone 14 Pro',
  'Nike Air Max shoes',
  'Instant Pot pressure cooker'
];

const results = await Promise.all(
  products.map(p => navigator.classifyProduct(p))
);
```

### With Error Handling
```typescript
try {
  const result = await navigator.classifyProduct(product);
  if (!result.success) {
    console.error(`Classification failed: ${result.error}`);
    // Use fallback category
  }
} catch (error) {
  // Handle API errors
  if (error.message.includes('rate limit')) {
    await delay(60000); // Wait 1 minute
  }
}
```

## 🔧 Configuration Options

```typescript
interface TaxonomyNavigatorConfig {
  taxonomyFile?: string;      // Default: ./data/taxonomy.en-US.txt
  apiKey?: string;           // Required
  model?: string;            // Default: gpt-4-0125-preview
  stage2Model?: string;      // Default: same as model
  stage3Model?: string;      // Default: same as model
  maxRetries?: number;       // Default: 3
  enableLogging?: boolean;   // Default: true
  rateLimit?: {
    maxRequestsPerMinute?: number;  // Default: 60
    maxRequestsPerDay?: number;     // Default: 10000
  };
}
```

## 📊 Performance Characteristics

- **API Calls**: 3-20 per classification (adaptive)
- **Processing Time**: 3-7 seconds per product
- **Cost**: ~$0.001-0.002 per product
- **Accuracy**: Very high due to numeric selection

### API Call Breakdown:
- Summary: 1 call
- Stage 1: 1 call
- Stage 2: 1-14 calls (depends on category size)
- Stage 3: 0-1 calls (skipped if only 1 option)

## 🐛 Common Issues & Solutions

### 1. "Cannot find taxonomy file"
```typescript
// Use absolute path
const taxonomyFile = path.join(__dirname, '../data/taxonomy.en-US.txt');
```

### 2. Rate Limiting
```typescript
// Implement delay between requests
await new Promise(resolve => setTimeout(resolve, 100));
```

### 3. Large Batches
```typescript
// Process in chunks
const chunkSize = 10;
for (let i = 0; i < products.length; i += chunkSize) {
  const chunk = products.slice(i, i + chunkSize);
  await processChunk(chunk);
}
```

## 🧪 Testing

### Run Interactive Mode
```bash
npm run interactive
```

### Run Batch Test
```bash
npm run batch-test
```

### Test Single Product
```bash
npm run classify -- "Your product description"
```

## 📁 File Structure

```
src/
├── TaxonomyNavigator.ts    # Core engine
├── config.ts              # Configuration utilities
├── types.ts               # TypeScript interfaces
├── interactiveInterface.ts # CLI interface
├── simpleBatchTester.ts   # Test utility
├── example.ts             # Usage examples
└── index.ts               # Module exports

scripts/
├── classify-single-product.js  # Quick classification
└── analyze-batch-products.js   # Batch analysis

data/
└── taxonomy.en-US.txt     # Google Product Taxonomy

tests/
└── sample_products.txt    # Test products
```

## 🔍 Debugging Tips

### Enable Verbose Logging
```typescript
const navigator = new TaxonomyNavigator({
  enableLogging: true
});
```

### Log Each Stage
```typescript
console.log('Stage 1:', selectedL1s);
console.log('Stage 2A:', leaves2A);
console.log('Stage 2B:', leaves2B);
console.log('Stage 3:', finalSelection);
```

### Check API Calls
```typescript
console.log(`Total API calls: ${result.apiCalls}`);
console.log(`Processing time: ${result.processingTime}ms`);
```

## 🚀 Production Considerations

### 1. Implement Caching
```typescript
const cache = new Map<string, ClassificationResult>();

async function classifyWithCache(product: string) {
  if (cache.has(product)) return cache.get(product);
  const result = await navigator.classifyProduct(product);
  cache.set(product, result);
  return result;
}
```

### 2. Add Rate Limiting
```typescript
// Uncomment rate limiting code in TaxonomyNavigator.ts
// See lines 450-480 for implementation
```

### 3. Use Cheaper Models
```typescript
const navigator = new TaxonomyNavigator({
  model: 'gpt-3.5-turbo',        // Cheaper
  stage3Model: 'gpt-4'           // Better for final decision
});
```

### 4. Monitor Costs
```typescript
let totalCost = 0;
result.apiCalls * 0.0001; // Approximate cost per call
```

## 📚 Additional Resources

- [Google Product Taxonomy](https://support.google.com/merchants/answer/6324436)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- Original Python implementation (now removed)

## 🤝 Contributing

When modifying the system:
1. Maintain the 5-stage process
2. Keep anti-hallucination measures
3. Update types in `types.ts`
4. Add tests for new features
5. Update documentation

## 📝 License

MIT License - See LICENSE file for details. 