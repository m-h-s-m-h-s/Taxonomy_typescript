/**
 * TypeScript type definitions for the Taxonomy Navigator system.
 *
 * This module defines all the interfaces and types used throughout the
 * taxonomy classification system, providing strong typing for better
 * development experience and runtime safety.
 *
 * TYPE ORGANIZATION:
 * - Configuration types: System behavior customization
 * - Data structure types: Taxonomy representation
 * - Result types: Classification output format
 * - Processing types: Internal batch processing
 *
 * DESIGN PRINCIPLES:
 * - Optional fields use ? for flexibility
 * - Required fields enforced at construction time
 * - Detailed property documentation for clarity
 * - Consistent naming conventions
 */
/**
 * Configuration interface for TaxonomyNavigator.
 *
 * Controls all aspects of the classification system's behavior,
 * from model selection to rate limiting.
 *
 * CONFIGURATION PHILOSOPHY:
 * - Sensible defaults for all options
 * - Override only what you need
 * - Production vs development flexibility
 */
export interface TaxonomyNavigatorConfig {
    /**
     * Path to the Google Product Taxonomy file.
     * Default: './data/taxonomy.en-US.txt'
     *
     * The file should be the official Google taxonomy in text format.
     * Download from: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
     */
    taxonomyFile?: string;
    /**
     * OpenAI API key for authentication.
     *
     * If not provided, will attempt to read from:
     * 1. OPENAI_API_KEY environment variable
     * 2. data/api_key.txt file
     *
     * @see getApiKey function in config.ts
     */
    apiKey?: string;
    /**
     * Default model for stages 0, 1, and 2.
     * Default: 'gpt-4.1-nano'
     *
     * Uses the most cost-effective model for initial stages
     * where high accuracy isn't critical.
     */
    model?: string;
    /**
     * Model specifically for stage 2 (leaf selection).
     * Default: Same as 'model'
     *
     * Can be overridden if you want a different model for
     * the batch processing stage.
     */
    stage2Model?: string;
    /**
     * Model for stage 3 (final selection).
     * Default: 'gpt-4.1-mini'
     *
     * Uses a more capable model for the critical final
     * decision to improve accuracy.
     */
    stage3Model?: string;
    /**
     * Maximum retry attempts for failed API calls.
     * Default: 3
     *
     * Note: Basic version doesn't implement retries.
     * This is for future robust version implementation.
     */
    maxRetries?: number;
    /**
     * Enable console logging for debugging.
     * Default: true
     *
     * Logs each stage's progress and results.
     * Set to false for production or quiet operation.
     */
    enableLogging?: boolean;
    /**
     * Rate limiting configuration.
     *
     * Controls API request frequency to respect OpenAI limits.
     * Basic version has this commented out.
     */
    rateLimit?: {
        /**
         * Maximum requests per second.
         * Default: 1
         *
         * Adjust based on your OpenAI tier limits.
         * See: https://platform.openai.com/docs/guides/rate-limits
         */
        requestsPerSecond?: number;
    };
}
/**
 * Represents a node in the taxonomy hierarchy tree.
 *
 * The tree structure mirrors Google's taxonomy hierarchy,
 * with each node potentially having multiple children.
 *
 * TREE STRUCTURE:
 * - Root node has name 'root'
 * - L1 nodes are direct children of root
 * - Leaf nodes have no children
 * - Non-leaf nodes are intermediate categories
 */
export interface TaxonomyNode {
    /**
     * The category name at this level.
     * Examples: "Electronics", "Televisions", "OLED TVs"
     */
    name: string;
    /**
     * Map of child category names to their nodes.
     * Empty object {} for leaf nodes.
     *
     * Using object instead of Map for JSON compatibility.
     */
    children: {
        [key: string]: TaxonomyNode;
    };
    /**
     * Whether this node represents a leaf category.
     *
     * Leaf categories are the ~5,597 end categories that
     * products are actually classified into.
     */
    isLeaf: boolean;
}
/**
 * Represents a complete taxonomy path from root to leaf.
 *
 * This flat representation is more efficient for filtering
 * and searching than tree traversal.
 *
 * USAGE:
 * - Primary data structure for classification
 * - Enables fast filtering by L1, leaf status
 * - Stores original formatting from file
 */
export interface TaxonomyPath {
    /**
     * The complete path as it appears in the taxonomy file.
     * Example: "Electronics > Video > Televisions"
     */
    fullPath: string;
    /**
     * Array of category names from root to leaf.
     * Example: ["Electronics", "Video", "Televisions"]
     *
     * Always has at least 1 element (L1 category).
     */
    parts: string[];
    /**
     * Whether this path ends at a leaf category.
     *
     * Critical for filtering during classification stages.
     */
    isLeaf: boolean;
}
/**
 * Result returned by the classifyProduct method.
 *
 * Contains both the classification results and metadata
 * about the process for debugging and optimization.
 *
 * RESULT INTERPRETATION:
 * - success=true with valid classification
 * - success=false with error details
 * - Multiple paths show alternatives considered
 * - bestMatchIndex points to the selected option
 */
export interface ClassificationResult {
    /**
     * Whether classification completed successfully.
     *
     * false indicates an error occurred at some stage.
     * Check 'error' field for details.
     */
    success: boolean;
    /**
     * All candidate paths from Stage 2.
     *
     * Shows all categories considered in final selection.
     * Useful for debugging and alternative suggestions.
     *
     * On error, contains [['False']] for compatibility.
     */
    paths: string[][];
    /**
     * Index of the best match in the paths array.
     *
     * 0-based index. Use paths[bestMatchIndex] to get
     * the selected category path.
     */
    bestMatchIndex: number;
    /**
     * The selected category as a formatted string.
     * Example: "Electronics > Video > Televisions"
     *
     * This is paths[bestMatchIndex].join(' > ') for convenience.
     * On error, this is 'False'.
     */
    bestMatch: string;
    /**
     * The leaf category name only.
     * Example: "Televisions"
     *
     * This is the final element of the selected path.
     * Useful for simpler integrations.
     */
    leafCategory: string;
    /**
     * Total processing time in milliseconds.
     *
     * Includes all API calls and processing.
     * Typical range: 2000-5000ms.
     */
    processingTime: number;
    /**
     * Number of API calls made during classification.
     *
     * Useful for cost estimation and optimization.
     * Typical range: 3-20 calls.
     *
     * Breakdown:
     * - Summary: 1 call
     * - Stage 1: 1 call
     * - Stage 2: 1-15 calls (depends on batches)
     * - Stage 3: 0-1 call (skipped if 1 result)
     */
    apiCalls: number;
    /**
     * Error message if success is false.
     *
     * Contains specific error details for debugging.
     * Only present when success=false.
     */
    error?: string;
}
/**
 * Configuration for batch processing in Stage 2.
 *
 * These settings control how large L1 categories are
 * divided into manageable batches for API processing.
 *
 * BATCH PROCESSING RATIONALE:
 * - API token limits prevent sending all categories at once
 * - Batching balances API calls vs token usage
 * - Settings are optimized through testing
 */
export interface BatchProcessingOptions {
    /**
     * Number of categories per batch.
     * Default: 100
     *
     * 100 categories ≈ 2-3K tokens, well within limits.
     * Larger batches risk token limit errors.
     */
    batchSize: number;
    /**
     * Maximum selections allowed per batch.
     * Default: 15
     *
     * Allows broad coverage while preventing the AI
     * from selecting too many irrelevant categories.
     */
    maxSelectionsPerBatch: number;
}
//# sourceMappingURL=types.d.ts.map