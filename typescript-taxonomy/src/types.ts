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
  children: { [key: string]: TaxonomyNode };
  
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
 * Result from product classification
 */
export interface ClassificationResult {
  /** Whether classification succeeded */
  success: boolean;
  
  /** All considered taxonomy paths */
  paths: string[][];
  
  /** Index of the best matching path */
  bestMatchIndex: number;
  
  /** Full taxonomy path of best match (e.g., "Electronics > Computers > Laptops") */
  bestMatch: string;
  
  /** Leaf category name only (e.g., "Laptops") */
  leafCategory: string;
  
  /** Time taken in milliseconds */
  processingTime: number;
  
  /** Number of OpenAI API calls made */
  apiCalls: number;
  
  /** Error message if classification failed */
  error?: string;
  
  /** Stage-by-stage details for verbose output */
  stageDetails?: {
    /** AI-generated product summary */
    aiSummary: string;
    
    /** Stage 1: Selected L1 categories */
    stage1L1Categories: string[];
    
    /** Stage 2A: Leaves from first L1 */
    stage2aLeaves: string[];
    
    /** Stage 2B: Leaves from second L1 (if applicable) */
    stage2bLeaves: string[];
    
    /** Whether stage 2B was skipped */
    stage2bSkipped: boolean;
    
    /** Total candidate leaves for stage 3 */
    totalCandidates: number;
    
    /** Whether stage 3 was skipped (only 1 candidate) */
    stage3Skipped: boolean;
  };
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