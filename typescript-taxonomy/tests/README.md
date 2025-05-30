# Tests Directory

## Current Contents

### Test Data
- `sample_products.txt` - 51 sample products for testing

### Demo Scripts
- `demo-single-product.ts` - Example of classifying a single product
- `demo-batch-classify.ts` - Example of batch classification

### Unit Tests (To Be Implemented)
- `TaxonomyNavigator.test.ts` - Unit tests for main classifier (requires Jest setup)
- `config.test.ts` - Unit tests for configuration module (requires Jest setup)

## Running Demo Scripts

```bash
# First compile TypeScript
npm run build

# Then run demos
node dist/tests/demo-single-product.js
node dist/tests/demo-batch-classify.js
```

## Setting Up Unit Tests

To enable proper unit testing:

```bash
# Install test dependencies
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test
```

## Why Unit Tests Are Not Active

The project currently lacks proper unit tests. The files ending in `.test.ts` are templates that require Jest to be installed and configured. The original Python project had extensive tests, but they weren't ported to TypeScript.

## What Should Be Tested

1. **TaxonomyNavigator**
   - Constructor with various configs
   - Product classification with edge cases
   - Stage-by-stage processing
   - Error handling

2. **Config Module**
   - API key loading priority
   - File reading errors
   - Environment variable handling

3. **Parsing Functions**
   - Numeric selection parsing
   - L1 category extraction
   - Response validation

4. **Batch Processing**
   - Token limit handling
   - Batch size calculations
   - Result aggregation 