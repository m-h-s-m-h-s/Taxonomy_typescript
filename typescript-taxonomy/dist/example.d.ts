/**
 * Example usage of the TypeScript Taxonomy Navigator
 *
 * This demonstrates both scrappy and robust usage patterns
 */
/**
 * Integration example - How to integrate into your existing TypeScript application
 */
export declare class ProductCategorizer {
    private navigator;
    constructor(apiKey: string, taxonomyFile: string);
    /**
     * Categorize a single product with caching
     */
    private cache;
    categorize(productInfo: string): Promise<string>;
    /**
     * Batch categorization with progress callback
     */
    categorizeBatch(products: string[], onProgress?: (completed: number, total: number) => void): Promise<Map<string, string>>;
}
//# sourceMappingURL=example.d.ts.map