"use strict";
/**
 * Example usage of the TypeScript Taxonomy Navigator
 *
 * This demonstrates both scrappy and robust usage patterns
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductCategorizer = void 0;
const index_1 = require("./index");
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
/**
 * Scrappy version - Quick and simple usage
 */
async function scrappyExample() {
    console.log('=== SCRAPPY VERSION ===\n');
    try {
        // Initialize with minimal config
        const navigator = new index_1.TaxonomyNavigator({
            taxonomyFile: path.join(__dirname, '../../data/taxonomy.en-US.txt'),
            apiKey: process.env.OPENAI_API_KEY,
            enableLogging: true
        });
        // Test products
        const products = [
            'iPhone 14 Pro: Smartphone with advanced camera system and A16 chip',
            'Nike Air Max 270: Running shoes with air cushioning technology',
            'Samsung 65-inch QLED TV: Smart television with quantum dot display'
        ];
        // Classify each product
        for (const product of products) {
            console.log(`\nClassifying: ${product}`);
            const result = await navigator.classifyProduct(product);
            if (result.success) {
                console.log(`✅ Category: ${result.leafCategory}`);
                console.log(`   Full path: ${result.bestMatch}`);
                console.log(`   API calls: ${result.apiCalls}`);
                console.log(`   Time: ${result.processingTime}ms`);
            }
            else {
                console.log(`❌ Failed: ${result.error}`);
            }
        }
    }
    catch (error) {
        console.error('Error:', error);
    }
}
/**
 * Robust version - Production-ready with error handling and rate limiting
 */
async function robustExample() {
    console.log('\n\n=== ROBUST VERSION ===\n');
    try {
        // Initialize with full config
        const navigator = new index_1.TaxonomyNavigator({
            taxonomyFile: path.join(__dirname, '../../data/taxonomy.en-US.txt'),
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-3.5-turbo', // Use cheaper model for cost savings
            enableLogging: false, // Disable logging in production
            maxRetries: 3,
            rateLimit: {
                maxRequestsPerMinute: 50,
                maxRequestsPerDay: 5000
            }
        });
        // Batch processing function
        async function classifyBatch(products) {
            const results = [];
            const batchSize = 10; // Process 10 at a time
            for (let i = 0; i < products.length; i += batchSize) {
                const batch = products.slice(i, i + batchSize);
                // Process batch with error handling
                const batchPromises = batch.map(async (product) => {
                    try {
                        return await navigator.classifyProduct(product);
                    }
                    catch (error) {
                        // Return error result instead of throwing
                        return {
                            success: false,
                            paths: [['Error']],
                            bestMatchIndex: 0,
                            bestMatch: 'Error',
                            leafCategory: 'Error',
                            processingTime: 0,
                            apiCalls: 0,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        };
                    }
                });
                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);
                // Add delay between batches to respect rate limits
                if (i + batchSize < products.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                }
            }
            return results;
        }
        // Test with multiple products
        const testProducts = [
            'MacBook Pro 16-inch: Laptop computer with M2 processor',
            'Dyson V15 Vacuum: Cordless vacuum cleaner with laser detection',
            'Instant Pot Duo: Multi-use pressure cooker and slow cooker',
            'Canon EOS R5: Professional mirrorless camera with 45MP sensor',
            'Peloton Bike+: Indoor exercise bike with interactive display'
        ];
        console.log(`Processing ${testProducts.length} products in batches...\n`);
        const results = await classifyBatch(testProducts);
        // Display results summary
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log('\nResults Summary:');
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log('\nDetailed Results:');
        results.forEach((result, index) => {
            const product = testProducts[index];
            console.log(`\n${index + 1}. ${product.split(':')[0]}`);
            if (result.success) {
                console.log(`   → ${result.leafCategory}`);
            }
            else {
                console.log(`   → Failed: ${result.error}`);
            }
        });
        // Calculate statistics
        const totalApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0);
        const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
        console.log('\nStatistics:');
        console.log(`Total API calls: ${totalApiCalls}`);
        console.log(`Average processing time: ${avgProcessingTime.toFixed(0)}ms`);
        console.log(`Average API calls per product: ${(totalApiCalls / results.length).toFixed(1)}`);
    }
    catch (error) {
        console.error('Error in robust example:', error);
    }
}
/**
 * Integration example - How to integrate into your existing TypeScript application
 */
class ProductCategorizer {
    constructor(apiKey, taxonomyFile) {
        /**
         * Categorize a single product with caching
         */
        this.cache = new Map();
        this.navigator = new index_1.TaxonomyNavigator({
            apiKey,
            taxonomyFile,
            enableLogging: false,
            // Use cheaper/faster models for production
            model: 'gpt-3.5-turbo',
            stage2Model: 'gpt-3.5-turbo',
            stage3Model: 'gpt-4' // Keep better model for final decision
        });
    }
    async categorize(productInfo) {
        // Check cache first
        const cached = this.cache.get(productInfo);
        if (cached) {
            return cached.leafCategory;
        }
        // Classify and cache
        const result = await this.navigator.classifyProduct(productInfo);
        this.cache.set(productInfo, result);
        if (result.success) {
            return result.leafCategory;
        }
        else {
            throw new Error(result.error || 'Classification failed');
        }
    }
    /**
     * Batch categorization with progress callback
     */
    async categorizeBatch(products, onProgress) {
        const results = new Map();
        let completed = 0;
        for (const product of products) {
            try {
                const category = await this.categorize(product);
                results.set(product, category);
            }
            catch (error) {
                results.set(product, 'Error');
            }
            completed++;
            if (onProgress) {
                onProgress(completed, products.length);
            }
        }
        return results;
    }
}
exports.ProductCategorizer = ProductCategorizer;
// Run examples if this file is executed directly
if (require.main === module) {
    (async () => {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            console.error('❌ Please set OPENAI_API_KEY environment variable');
            console.log('\nYou can:');
            console.log('1. Create a .env file with: OPENAI_API_KEY=your-key-here');
            console.log('2. Or run: export OPENAI_API_KEY=your-key-here');
            process.exit(1);
        }
        // Run scrappy example
        await scrappyExample();
        // Run robust example
        await robustExample();
    })();
}
//# sourceMappingURL=example.js.map