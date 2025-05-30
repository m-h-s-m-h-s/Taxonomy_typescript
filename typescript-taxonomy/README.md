# TypeScript Taxonomy Navigator

A TypeScript implementation of the AI-powered product categorization system that classifies products into Google Product Taxonomy categories using OpenAI's GPT models.

This is a TypeScript port of the Python Taxonomy Navigator (v12.5), maintaining the same 5-stage classification process with anti-hallucination measures.

## 🚀 Quick Start

### Installation

```bash
# Clone/copy the typescript-taxonomy directory to your project
cp -r typescript-taxonomy your-project/

# Install dependencies
cd your-project/typescript-taxonomy
npm install
```

### Basic Usage (Scrappy Version)

```typescript
import { TaxonomyNavigator } from './typescript-taxonomy';

// Initialize
const navigator = new TaxonomyNavigator({
  taxonomyFile: './data/taxonomy.en-US.txt',
  apiKey: 'your-openai-api-key',
  enableLogging: true
});

// Classify a product
const result = await navigator.classifyProduct(
  'iPhone 14 Pro: Smartphone with advanced camera system'
);

if (result.success) {
  console.log(`Category: ${result.leafCategory}`);
  console.log(`Full path: ${result.bestMatch}`);
} else {
  console.log(`Error: ${result.error}`);
}
```

## 📋 Features

- **5-Stage AI Classification Process**:
  1. AI-generated product summary (40-60 words)
  2. Stage 1: Select 2 main categories from ~21 options
  3. Stage 2: Select specific categories using batch processing
  4. Stage 3: Final selection from all candidates

- **Anti-Hallucination Measures**:
  - Numeric selection to prevent misspellings
  - Batch processing (100 categories per batch)
  - Strict validation at every stage
  - Zero context between API calls

- **TypeScript Benefits**:
  - Full type safety
  - Async/await support
  - Easy integration with modern web frameworks
  - Built-in error handling

## 🛠️ Configuration Options

```typescript
interface TaxonomyNavigatorConfig {
  taxonomyFile?: string;      // Path to taxonomy file
  apiKey?: string;           // OpenAI API key
  model?: string;            // Model for stages 1 & summary
  stage2Model?: string;      // Model for stage 2
  stage3Model?: string;      // Model for stage 3
  maxRetries?: number;       // Max retry attempts
  enableLogging?: boolean;   // Enable debug logging
  rateLimit?: {              // Rate limiting config
    maxRequestsPerMinute?: number;
    maxRequestsPerDay?: number;
  };
}
```

## 💡 Integration Examples

### 1. Express.js API Endpoint

```typescript
import express from 'express';
import { TaxonomyNavigator } from './typescript-taxonomy';

const app = express();
const navigator = new TaxonomyNavigator({
  apiKey: process.env.OPENAI_API_KEY,
  enableLogging: false
});

app.post('/api/categorize', async (req, res) => {
  try {
    const { productInfo } = req.body;
    const result = await navigator.classifyProduct(productInfo);
    
    if (result.success) {
      res.json({
        category: result.leafCategory,
        fullPath: result.bestMatch,
        apiCalls: result.apiCalls
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. React Hook

```typescript
import { useState, useCallback } from 'react';
import { TaxonomyNavigator, ClassificationResult } from './typescript-taxonomy';

const navigator = new TaxonomyNavigator({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

export function useProductCategorization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const categorize = useCallback(async (productInfo: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await navigator.classifyProduct(productInfo);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { categorize, loading, error };
}
```

### 3. Batch Processing with Queue

```typescript
import { TaxonomyNavigator } from './typescript-taxonomy';
import PQueue from 'p-queue';

class BatchCategorizer {
  private navigator: TaxonomyNavigator;
  private queue: PQueue;
  
  constructor(apiKey: string) {
    this.navigator = new TaxonomyNavigator({
      apiKey,
      enableLogging: false,
      model: 'gpt-3.5-turbo' // Use cheaper model
    });
    
    // Limit to 10 concurrent requests
    this.queue = new PQueue({ concurrency: 10 });
  }
  
  async categorizeProducts(products: string[]) {
    const tasks = products.map(product => 
      this.queue.add(() => this.navigator.classifyProduct(product))
    );
    
    return Promise.all(tasks);
  }
}
```

## 🚀 Production Deployment

### Environment Variables

```bash
# .env file
OPENAI_API_KEY=your-api-key-here
TAXONOMY_FILE_PATH=/path/to/taxonomy.txt
NODE_ENV=production
```

### Docker Example

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### Error Handling Best Practices

```typescript
try {
  const result = await navigator.classifyProduct(productInfo);
  
  if (!result.success) {
    // Handle classification failure
    logger.warn(`Classification failed: ${result.error}`);
    return fallbackCategory;
  }
  
  return result.leafCategory;
} catch (error) {
  // Handle API/network errors
  logger.error('Categorization error:', error);
  
  // Implement fallback strategy
  if (error.message.includes('rate limit')) {
    await delay(60000); // Wait 1 minute
    return retry();
  }
  
  throw error;
}
```

## 📊 Performance Optimization

### 1. Implement Caching

```typescript
const cache = new Map<string, ClassificationResult>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function categorizeWithCache(product: string) {
  const cached = cache.get(product);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const result = await navigator.classifyProduct(product);
  cache.set(product, { result, timestamp: Date.now() });
  return result;
}
```

### 2. Use Cheaper Models

```typescript
const navigator = new TaxonomyNavigator({
  model: 'gpt-3.5-turbo',      // Cheaper for stages 1-2
  stage3Model: 'gpt-4'          // Better accuracy for final decision
});
```

### 3. Implement Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const categorizationLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 50,              // 50 requests per minute
  message: 'Too many categorization requests'
});

app.use('/api/categorize', categorizationLimiter);
```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot find taxonomy file"**
   - Ensure the taxonomy file path is correct
   - Use absolute paths in production

2. **"Rate limit exceeded"**
   - Implement exponential backoff
   - Reduce concurrent requests
   - Use the built-in rate limiting features

3. **"Timeout errors"**
   - Increase timeout settings
   - Implement retry logic
   - Consider using streaming responses

### Debug Mode

```typescript
const navigator = new TaxonomyNavigator({
  enableLogging: true,
  // This will log each stage's progress
});
```

## 📦 File Structure

```
typescript-taxonomy/
├── src/
│   ├── index.ts              # Main exports
│   ├── TaxonomyNavigator.ts  # Core implementation
│   ├── types.ts              # TypeScript interfaces
│   └── example.ts            # Usage examples
├── data/
│   └── taxonomy.en-US.txt    # Google Product Taxonomy
├── package.json
├── tsconfig.json
└── README.md
```

## 🔄 Migration from Python

If you're migrating from the Python version:

1. The API is similar but uses TypeScript conventions
2. Results are returned as objects instead of tuples
3. Async/await is used instead of synchronous calls
4. Configuration is passed as an object

Python:
```python
navigator = TaxonomyNavigator("taxonomy.txt", api_key)
paths, best_idx = navigator.navigate_taxonomy(product)
```

TypeScript:
```typescript
const navigator = new TaxonomyNavigator({ 
  taxonomyFile: "taxonomy.txt", 
  apiKey 
});
const result = await navigator.classifyProduct(product);
```

## 📈 Cost Estimation

- **API Calls per classification**: 3-20 (adaptive)
- **Average cost**: ~$0.001-0.002 per product
- **Monthly estimates**:
  - 10,000 products: ~$10-20
  - 100,000 products: ~$100-200
  - 1,000,000 products: ~$1,000-2,000

## 🤝 Contributing

Feel free to modify and extend this implementation for your needs. Key areas for enhancement:

- Add database caching layer
- Implement webhook notifications
- Add multi-language support
- Create a web UI
- Add analytics and monitoring

## 📄 License

MIT License - Feel free to use in your commercial projects.

## 🙏 Credits

Based on the Python Taxonomy Navigator v12.5 implementation. 