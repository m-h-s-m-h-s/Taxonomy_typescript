# Technical Guide - TypeScript Taxonomy Navigator

## 🏗️ Architecture Overview

The Taxonomy Navigator uses a 5-stage AI-powered process to classify products into Google's 5,597 product categories.

### Classification Pipeline

1. **AI Summary Generation** - Creates focused 40-60 word product summary
2. **Stage 1** - Selects 2 main categories from ~21 top-level options
3. **Stage 2A/2B** - Narrows down using batch processing (100 items/batch)
4. **Stage 3** - Final selection from all candidates

### Anti-Hallucination Measures

- **Numeric Selection**: AI returns category index (e.g., "315") not text
- **Batch Processing**: Ensures all 5,597 categories are accessible
- **Validation**: Strict checks at every stage
- **Zero Context**: Each API call is independent

## 📦 Installation & Setup

### From NPM (coming soon)
```bash
npm install taxonomy-navigator
```

### From Source
```bash
git clone <repo>
cd typescript-taxonomy
npm install
npm run build
```

### API Key Setup
```typescript
// Option 1: Environment variable 
process.env.OPENAI_API_KEY = "sk-...";

// Option 2: File (development)
echo "sk-..." > data/api_key.txt

// Option 3: Direct parameter
new TaxonomyNavigator({ apiKey: "sk-..." });
```

## 🔧 Core API Reference

### TaxonomyNavigator Class

```typescript
import { TaxonomyNavigator } from './TaxonomyNavigator';

const navigator = new TaxonomyNavigator({
  taxonomyFile?: string;      // Default: ./data/taxonomy.en-US.txt
  apiKey?: string;           // Required (checks env/file if not provided)
  model?: string;            // Default: gpt-4.1-nano
  stage2Model?: string;      // Default: gpt-4.1-nano
  stage3Model?: string;      // Default: gpt-4.1-mini
  maxRetries?: number;       // Default: 3
  enableLogging?: boolean;   // Default: true
  rateLimit?: {
    maxRequestsPerMinute?: number;  // Default: 60
    maxRequestsPerDay?: number;     // Default: 10000
  };
});
```

### Main Method

```typescript
const result = await navigator.classifyProduct(productDescription: string);

// Returns ClassificationResult:
{
  success: boolean;
  leafCategory?: string;        // e.g., "Mobile Phones"
  bestMatch?: string;           // e.g., "Electronics > Communications > Telephony > Mobile Phones"
  bestMatchIndex?: number;      // Index in taxonomy
  paths?: TaxonomyPath[];       // All matching paths
  apiCalls?: number;            // Number of API calls made
  processingTime?: number;      // Time in milliseconds
  error?: string;               // Error message if failed
}
```

## 💻 Integration Examples

### Express.js API

```typescript
import express from 'express';
import { TaxonomyNavigator } from './TaxonomyNavigator';

const app = express();
app.use(express.json());

const navigator = new TaxonomyNavigator({
  apiKey: process.env.OPENAI_API_KEY,
  enableLogging: false
});

app.post('/api/categorize', async (req, res) => {
  try {
    const { product } = req.body;
    const result = await navigator.classifyProduct(product);
    
    if (result.success) {
      res.json({
        category: result.leafCategory,
        path: result.bestMatch,
        cost: result.apiCalls * 0.0001 // Rough estimate
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(3000);
```

### React Hook

```typescript
import { useState } from 'react';
import { TaxonomyNavigator } from './TaxonomyNavigator';

const navigator = new TaxonomyNavigator({
  apiKey: process.env.REACT_APP_OPENAI_KEY
});

export function useProductCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const categorize = async (product: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await navigator.classifyProduct(product);
      if (!result.success) throw new Error(result.error);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  return { categorize, loading, error };
}
```

### Batch Processing

```typescript
async function processBatch(products: string[]) {
  const results = await Promise.all(
    products.map(p => navigator.classifyProduct(p))
  );
  
  return results.filter(r => r.success);
}
```

## 🚀 Production Best Practices

### 1. Implement Caching

```typescript
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function categorizeWithCache(product: string) {
  const cached = cache.get(product);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.result;
  }
  
  const result = await navigator.classifyProduct(product);
  cache.set(product, { result, time: Date.now() });
  return result;
}
```

### 2. Error Handling & Retries

```typescript
async function robustCategorize(product: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await navigator.classifyProduct(product);
      if (result.success) return result;
    } catch (error) {
      if (error.message.includes('rate limit')) {
        await new Promise(r => setTimeout(r, 60000)); // Wait 1 min
      } else if (i === retries - 1) {
        throw error;
      }
    }
  }
}
```

### 3. Use Cheaper Models

```typescript
// Default already uses optimal models:
// - gpt-4.1-nano for stages 0-2 (cheap, efficient)
// - gpt-4.1-mini for stage 3 (better accuracy)

// If you want even cheaper (but less accurate):
const navigator = new TaxonomyNavigator({
  model: 'gpt-3.5-turbo',        // Even cheaper for stages 0-2
  stage3Model: 'gpt-3.5-turbo'   // Sacrifice some accuracy for cost
});
```

### 4. Database Integration

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function categorizeAndSave(productId: string, description: string) {
  // Check cache first
  const existing = await prisma.productCategory.findUnique({
    where: { productId }
  });
  if (existing) return existing;
  
  // Categorize
  const result = await navigator.classifyProduct(description);
  
  // Save to database
  if (result.success) {
    return await prisma.productCategory.create({
      data: {
        productId,
        category: result.leafCategory,
        fullPath: result.bestMatch,
        confidence: 0.95, // You can add confidence scoring
        apiCalls: result.apiCalls,
        classifiedAt: new Date()
      }
    });
  }
}
```

## 📊 Performance & Cost

### API Call Breakdown
- Summary generation: 1 call
- Stage 1: 1 call
- Stage 2: 1-14 calls (depends on category size)
- Stage 3: 0-1 calls (skipped if only 1 option)
- **Total**: 3-20 calls per product

### Cost Optimization
- **Default (nano/mini)**: ~$0.001-0.002 per product
- **Budget (GPT-3.5)**: ~$0.0003 per product
- **Premium (GPT-4)**: ~$0.01 per product

### Processing Time
- Average: 3-7 seconds per product
- Batch of 100: ~5-10 minutes
- Can process ~500-1000 products/hour per instance

## 🔄 Migration from Python

### Key Differences

| Python | TypeScript |
|--------|------------|
| `navigate_taxonomy()` | `classifyProduct()` |
| Returns tuple `(paths, idx)` | Returns object with named fields |
| Synchronous | Async/await |
| `config.py` | `config.ts` with same logic |

### Migration Example

Python:
```python
navigator = TaxonomyNavigator("taxonomy.txt", api_key)
paths, best_idx = navigator.navigate_taxonomy(product)
category = paths[best_idx].get_leaf_category()
```

TypeScript:
```typescript
const navigator = new TaxonomyNavigator({ 
  taxonomyFile: "taxonomy.txt", 
  apiKey 
});
const result = await navigator.classifyProduct(product);
const category = result.leafCategory;
```

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module"**
- Run `npm run build` first

**"Rate limit exceeded"**
- Implement exponential backoff
- Reduce concurrent requests
- Wait 60 seconds between retries

**"Invalid API key"**
- Check format starts with 'sk-'
- Verify in OpenAI dashboard
- Check file has no extra whitespace

**"Timeout errors"**
- Each classification takes 3-7 seconds
- Increase timeout settings
- Check network connection

### Debug Mode

```typescript
// Enable detailed logging
const navigator = new TaxonomyNavigator({
  enableLogging: true
});

// Logs will show:
// - Each stage's progress
// - API calls being made
// - Categories being considered
// - Final selection reasoning
```

## 📄 License

MIT License - Free for commercial use 