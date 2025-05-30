# Project Structure

This document describes the organization of the TypeScript Taxonomy Navigator project.

## Directory Layout

```
typescript-taxonomy/
├── src/                        # Core TypeScript source files
│   ├── TaxonomyNavigator.ts   # Main classification engine
│   ├── config.ts              # Configuration management
│   ├── types.ts               # TypeScript type definitions
│   ├── index.ts               # Package entry point
│   ├── interactiveInterface.ts # Interactive CLI mode
│   └── simpleBatchTester.ts   # Batch testing utilities
│
├── scripts/                    # Utility scripts (JavaScript)
│   ├── check-setup.js         # Verify installation
│   ├── classify-single-product.js # Quick classification
│   └── test-random-products.js    # Random product testing
│
├── examples/                   # Example code
│   └── usage-examples.ts      # Comprehensive usage examples
│
├── tests/                      # Test files and data
│   ├── sample_products.txt    # 51 test products dataset
│   ├── test-product.ts        # Single product test
│   └── classify-test-products.ts # Batch classification test
│
├── docs/                       # All documentation
│   ├── HOW_TO_USE.md          # User guide
│   ├── QUICK_REFERENCE.md     # Command reference
│   ├── TECHNICAL_GUIDE.md     # Developer documentation
│   ├── ARCHITECTURE.md        # Design decisions
│   └── PROJECT_STRUCTURE.md   # This file
│
├── data/                       # Data files
│   ├── taxonomy.en-US.txt     # Google product taxonomy
│   └── api_key.txt            # OpenAI API key (gitignored)
│
├── dist/                       # Compiled JavaScript (gitignored)
├── node_modules/               # Dependencies (gitignored)
│
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT license
├── README.md                  # Main project documentation
├── package.json               # NPM configuration
├── package-lock.json          # Dependency lock file
└── tsconfig.json              # TypeScript configuration
```

## Key Files

### Core Implementation (src/)
- **TaxonomyNavigator.ts**: The heart of the system - implements the 5-stage classification pipeline
- **config.ts**: Handles API key loading from multiple sources (env, file, args)
- **types.ts**: Defines all TypeScript interfaces and types
- **index.ts**: Package entry point for importing as a library

### CLI Tools (src/)
- **interactiveInterface.ts**: Interactive mode for testing multiple products
- **simpleBatchTester.ts**: Batch testing with progress display

### Utility Scripts (scripts/)
Each script serves a specific purpose:
- `check-setup.js` - Verifies your installation is complete
- `classify-single-product.js` - Quick one-off classifications from command line
- `test-random-products.js` - Tests with random product samples

### Examples (examples/)
- `usage-examples.ts` - Shows scrappy vs robust usage patterns, batch processing, and integration examples

### Tests (tests/)
- `sample_products.txt` - Real product examples from various categories
- `test-product.ts` - Simple test for single product classification
- `classify-test-products.ts` - Advanced test with random selection

### Documentation (docs/)
All documentation is centralized here:
- **HOW_TO_USE.md** - Step-by-step guide for new users
- **QUICK_REFERENCE.md** - All commands at a glance
- **TECHNICAL_GUIDE.md** - Implementation details for developers
- **ARCHITECTURE.md** - Design decisions and rationale
- **PROJECT_STRUCTURE.md** - This file

### Configuration Files
- `package.json` - Defines npm scripts and dependencies
- `tsconfig.json` - TypeScript compiler configuration
- `.gitignore` - Prevents sensitive files from being committed
- `LICENSE` - MIT license terms

## npm Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Watch mode for development
- `npm start` - Run usage examples
- `npm run check` - Verify setup is complete
- `npm run interactive` - Interactive classification mode
- `npm run batch-test` - Batch testing with visual progress
- `npm run test-random [n]` - Test n random products
- `npm run classify -- "product"` - Classify single product

## File Organization Principles

1. **src/**: Only core TypeScript implementation files
2. **scripts/**: Simple utility scripts that users run directly
3. **examples/**: Example code showing how to use the library
4. **tests/**: Test files and test data
5. **docs/**: All documentation in one place
6. **Root level**: Only essential config files and main README 