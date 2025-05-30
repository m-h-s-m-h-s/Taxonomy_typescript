# TypeScript Taxonomy Navigator - Integration Guide

## Quick Integration (Scrappy Version)

### 1. Copy the directory to your project
```bash
cp -r typescript-taxonomy your-project/lib/
```

### 2. Install dependencies manually (since npm had issues)
Add to your `package.json`:
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "dotenv": "^16.0.0"
  }
}
```

### 3. Basic usage in your code:

```typescript
import { TaxonomyNavigator } from './lib/typescript-taxonomy/src/TaxonomyNavigator';

const classifier = new TaxonomyNavigator({
  taxonomyFile: './lib/typescript-taxonomy/data/taxonomy.en-US.txt',
  apiKey: process.env.OPENAI_API_KEY
});

// Classify a product
const result = await classifier.classifyProduct(
  'Samsung 65-inch QLED TV with smart features'
);

console.log(result.leafCategory); // "Televisions"
console.log(result.bestMatch);    // "Electronics > Video > Televisions"
```

## Core Algorithm Overview

The system uses a 5-stage process to classify products from 5,000+ categories:

1. **AI Summary**: Generate 40-60 word product summary
2. **Stage 1**: Select 2 broad categories (e.g., "Electronics", "Home & Garden")
3. **Stage 2A/2B**: Select specific categories from chosen broad categories (batch processing, numeric selection)
4. **Stage 3**: Final selection from all candidates

Key features preventing AI errors:
- Numeric selection (AI returns "315" not "Television")
- Batch processing (ensures all 900+ categories in large sections are accessible)
- Validation at every stage

## For Production (Robust Version)

### Add these enhancements:

1. **Rate Limiting**:
```typescript
// Uncomment the rate limiting code in TaxonomyNavigator.ts
// See lines 450-480 for the implementation
```

2. **Caching**:
```typescript
const cache = new Map();
async function classifyWithCache(product: string) {
  if (cache.has(product)) return cache.get(product);
  const result = await classifier.classifyProduct(product);
  cache.set(product, result);
  return result;
}
```

3. **Error Handling**:
```typescript
try {
  const result = await classifier.classifyProduct(product);
  if (!result.success) {
    // Handle failure - maybe use a default category
    return DEFAULT_CATEGORY;
  }
  return result.leafCategory;
} catch (error) {
  // Log error, retry, or fallback
  console.error('Classification failed:', error);
  return DEFAULT_CATEGORY;
}
```

4. **Batch Processing**:
```typescript
// Process multiple products efficiently
const products = [...]; // Your product list
const results = await Promise.all(
  products.map(p => classifier.classifyProduct(p))
);
```

## Cost & Performance

- **API Calls**: 3-20 per product (adaptive based on complexity)
- **Cost**: ~$0.001-0.002 per product
- **Time**: 3-7 seconds per product
- **Accuracy**: Very high due to numeric selection and validation

## Notes for Engineering

1. The TypeScript code mirrors the Python logic exactly
2. All the anti-hallucination measures are preserved
3. The taxonomy file (432KB) needs to be included with deployment
4. Consider using cheaper models (gpt-3.5-turbo) for stages 1-2 to reduce costs
5. The system is stateless - perfect for serverless/lambda functions
6. Memory usage is minimal (~50MB including taxonomy)

## Testing

Run the example to see it in action:
```bash
cd typescript-taxonomy
node -r ts-node/register src/example.ts
```

Or compile and run:
```bash
npm run build
node dist/example.js
``` 