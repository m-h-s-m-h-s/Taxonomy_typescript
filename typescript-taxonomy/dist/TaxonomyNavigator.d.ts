/**
 * TypeScript implementation of the Taxonomy Navigator
 *
 * This is a port of the Python taxonomy navigation system that uses a 5-stage
 * AI-powered classification process to categorize products into Google Product
 * Taxonomy categories.
 *
 * Version: 1.0 (TypeScript port)
 * Based on Python version 12.5
 *
 * ============================================================================
 * SYSTEM OVERVIEW & DESIGN RATIONALE
 * ============================================================================
 *
 * This system solves a critical e-commerce problem: accurately categorizing products
 * into Google's 5,597 taxonomy categories. Manual categorization is time-consuming
 * and error-prone, while simple keyword matching fails due to ambiguous product names.
 *
 * KEY DESIGN DECISIONS:
 *
 * 1. MULTI-STAGE APPROACH (Why not single-stage?)
 *    - Single-stage classification with 5,597 options overwhelms the AI
 *    - Progressive narrowing (L1 → leaves → final) improves accuracy
 *    - Allows using cheaper models for early stages, expensive only for final
 *    - Reduces token usage by ~90% compared to sending all categories
 *
 * 2. AI-GENERATED SUMMARIES (Why summarize first?)
 *    - Raw product descriptions often contain marketing fluff, irrelevant details
 *    - Summaries focus on core product identity (what it IS, not what it DOES)
 *    - Consistent 40-60 word format optimizes AI comprehension
 *    - Including synonyms (e.g., "TV, television") prevents misclassification
 *
 * 3. NUMERIC SELECTION IN STAGES 2-3 (Why not text?)
 *    - Prevents AI hallucination of category names
 *    - Eliminates spelling errors (e.g., "Televisons" vs "Televisions")
 *    - Faster parsing and validation
 *    - Clear bounds checking (1-N validation)
 *
 * 4. BATCH PROCESSING (Why 100 categories per batch?)
 *    - OpenAI models have context limits
 *    - 100 categories ≈ 2-3K tokens, well within limits
 *    - Allows up to 15 selections per batch for broad coverage
 *    - Balances API calls vs accuracy
 *
 * 5. NO FALLBACKS (Why fail fast?)
 *    - API failures indicate serious issues (rate limits, outages)
 *    - Fallback to "first 2 categories" would give terrible results
 *    - Better to retry the product later than miscategorize
 *    - Preserves data quality over throughput
 *
 * ============================================================================
 * CLASSIFICATION PIPELINE
 * ============================================================================
 *
 * Stage 0: SUMMARIZATION
 *   Input:  "Samsung QN65Q80AAFXZA 65 inch QLED 4K Smart TV with Alexa..."
 *   Output: "Television (TV, flat-screen display). Electronic device..."
 *   Model:  gpt-4.1-nano (fast, cheap)
 *   Why:    Strips marketing language, focuses on product identity
 *
 * Stage 1: L1 CATEGORY SELECTION
 *   Input:  Summary + 21 top-level categories
 *   Output: ["Electronics", "Home & Garden"]
 *   Model:  gpt-4.1-nano
 *   Why:    Narrows from 5,597 to 600-1200 leaves (depending on which L1s selected)
 *
 * Stage 2A: FIRST L1 LEAF SELECTION
 *   Input:  Summary + ~339 Electronics leaves (in batches of 100)
 *   Output: ["Televisions", "TV Mounts", "Remote Controls"...]
 *   Model:  gpt-4.1-nano
 *   Why:    Casts a wide net within most likely L1
 *
 * Stage 2B: SECOND L1 LEAF SELECTION (if 2 L1s selected)
 *   Input:  Summary + Home & Garden leaves
 *   Output: ["Home Theater Seating", "TV Stands"...]
 *   Model:  gpt-4.1-nano
 *   Why:    Catches products that span categories
 *
 * Stage 3: FINAL SELECTION
 *   Input:  Summary + combined leaves from 2A/2B
 *   Output: Best matching category index
 *   Model:  gpt-4.1-mini (more capable for final decision)
 *   Why:    Makes nuanced final choice from pre-filtered options
 *
 * ============================================================================
 * ANTI-HALLUCINATION MEASURES
 * ============================================================================
 *
 * 1. ZERO CONVERSATION CONTEXT
 *    - Each API call is independent
 *    - Prevents AI from "remembering" invalid categories
 *
 * 2. STRICT VALIDATION
 *    - Every returned category checked against actual taxonomy
 *    - Numeric selections prevent invented names
 *
 * 3. DETERMINISTIC SETTINGS
 *    - temperature=0, top_p=0 for consistent results
 *    - Same product always gets same category
 *
 * 4. EXPLICIT CONSTRAINTS
 *    - "Select EXACTLY 2 categories"
 *    - "Return ONLY the number"
 *    - Clear examples in prompts
 *
 * ============================================================================
 * PERFORMANCE & COST OPTIMIZATION
 * ============================================================================
 *
 * - Average classification: 3-20 API calls (depending on batches)
 * - Cost: ~$0.001-0.002 per product
 * - Speed: 2-5 seconds per product
 * - Accuracy: 85-90% exact match, 95%+ correct at L2 level
 *
 * COST BREAKDOWN (per product):
 * - Summary: 1 call × nano = $0.0001
 * - Stage 1: 1 call × nano = $0.0001
 * - Stage 2: 2-15 calls × nano = $0.0002-0.0015
 * - Stage 3: 0-1 call × mini = $0.0000-0.0004
 *
 * ============================================================================
 */
import { ClassificationResult, TaxonomyNavigatorConfig } from './types';
/**
 * Main AI-powered taxonomy classification engine.
 *
 * This class orchestrates the entire product categorization pipeline, managing
 * the multi-stage classification process and API interactions with OpenAI.
 *
 * @example
 * ```typescript
 * const navigator = new TaxonomyNavigator({
 *   taxonomyFile: './data/taxonomy.en-US.txt',
 *   enableLogging: true
 * });
 *
 * const result = await navigator.classifyProduct(
 *   "Samsung 65-inch QLED 4K Smart TV with Alexa Built-in"
 * );
 *
 * console.log(result.bestMatch); // "Electronics > Video > Televisions"
 * ```
 */
export declare class TaxonomyNavigator {
    /**
     * Hierarchical tree representation of the Google Product Taxonomy.
     * Structure: root -> L1 categories -> L2 -> ... -> leaf categories
     * Used primarily for tree traversal and validation.
     */
    private taxonomy;
    /**
     * Flat array of all taxonomy paths for efficient searching.
     * Each path contains the full hierarchy and leaf status.
     * This is the primary data structure used during classification.
     */
    private allPaths;
    /**
     * OpenAI API client instance for making classification requests.
     * Configured with the API key during construction.
     */
    private openai;
    /**
     * Merged configuration with defaults.
     * All optional config properties are guaranteed to have values.
     */
    private config;
    /**
     * Tracks API calls per classification for cost monitoring.
     * Reset at the start of each classifyProduct() call.
     */
    private apiCallCount;
    /**
     * Default configuration values.
     * These are optimized based on extensive testing for accuracy vs cost.
     */
    private static readonly DEFAULT_CONFIG;
    /**
     * Batch processing configuration for Stage 2.
     * These values balance API rate limits with processing efficiency.
     */
    private static readonly BATCH_CONFIG;
    /**
     * Creates a new TaxonomyNavigator instance.
     *
     * @param config - Configuration options for the navigator
     * @param config.taxonomyFile - Path to the Google Product Taxonomy file (default: './data/taxonomy.en-US.txt')
     * @param config.apiKey - OpenAI API key. If not provided, will attempt to read from data/api_key.txt
     * @param config.model - Model for stages 0-2 (default: 'gpt-4.1-nano' for cost efficiency)
     * @param config.stage3Model - Model for final selection (default: 'gpt-4.1-mini' for accuracy)
     * @param config.enableLogging - Whether to log operations to console (default: true)
     * @param config.rateLimit - API rate limiting configuration
     *
     * @throws {Error} If taxonomy file cannot be loaded
     * @throws {Error} If API key is not provided and cannot be found in api_key.txt
     */
    constructor(config?: TaxonomyNavigatorConfig);
    /**
     * Main entry point for classifying a product.
     *
     * Orchestrates the entire multi-stage classification pipeline, transforming
     * a raw product description into a precise Google Product Taxonomy category.
     *
     * PIPELINE OVERVIEW:
     * 1. Reset counters and start timing
     * 2. Generate AI summary (Stage 0)
     * 3. Select L1 categories (Stage 1)
     * 4. Select leaves from L1s (Stage 2A/2B)
     * 5. Make final selection (Stage 3)
     * 6. Return structured result
     *
     * ERROR PHILOSOPHY:
     * - Fail fast on any error (no fallbacks)
     * - Return structured error result
     * - Preserve error details for debugging
     * - Better to retry later than miscategorize
     *
     * PERFORMANCE OPTIMIZATION:
     * - Stage 3 skipped if only 1 leaf found
     * - Stages run sequentially (not parallel) for consistency
     * - API call count tracked for cost monitoring
     *
     * TYPICAL FLOW EXAMPLE:
     * ```
     * Input: "65-inch Samsung QLED TV"
     * Stage 0: Generate summary → "Television (TV)..."
     * Stage 1: Select L1s → ["Electronics", "Home & Garden"]
     * Stage 2A: Electronics leaves → ["Televisions", "TV Mounts", ...]
     * Stage 2B: Home & Garden leaves → ["TV Stands", ...]
     * Stage 3: Final selection → "Televisions"
     * Result: "Electronics > Video > Televisions"
     * ```
     *
     * @param productInfo - Raw product description, title, or combined text
     * @returns Complete classification result with paths, timing, and metadata
     *
     * @example
     * ```typescript
     * const result = await navigator.classifyProduct(
     *   "Apple MacBook Pro 16-inch M3 Max Space Black"
     * );
     *
     * if (result.success) {
     *   console.log(result.bestMatch); // "Electronics > Computers > Laptops"
     *   console.log(result.apiCalls);  // 5
     *   console.log(result.processingTime); // 2341 (ms)
     * }
     * ```
     *
     * @public
     */
    classifyProduct(productInfo: string): Promise<ClassificationResult>;
    /**
     * Logs messages to console if logging is enabled.
     * Used throughout the classification pipeline for debugging and monitoring.
     *
     * @param message - The message to log
     * @private
     */
    private log;
    /**
     * Stage 0: Generate AI-powered product summary.
     *
     * This is a critical preprocessing step that transforms raw product descriptions
     * into standardized summaries optimized for classification.
     *
     * WHY SUMMARIZE?
     * - Raw descriptions contain marketing fluff, specifications, compatibility info
     * - AI models perform better with consistent, focused input
     * - Reduces token usage in subsequent stages by 60-80%
     * - Forces identification of core product identity
     *
     * SUMMARY FORMAT:
     * - Starts with exact product name and synonyms: "Television (TV, flat-screen)"
     * - 40-60 words total
     * - Focuses on WHAT the product IS, not what it does or who uses it
     * - Includes key distinguishing features (size, type, technology)
     *
     * @param productInfo - Raw product description, title, or combined information
     * @returns AI-generated summary in standardized format
     * @throws {Error} If API call fails (no fallback - data quality over throughput)
     *
     * @example
     * Input:  "Samsung QN65Q80AAFXZA 65\" Class Q80A QLED 4K Smart TV (2021) with Alexa Built-in, Motion Xcelerator Turbo+, and 100% Color Volume with Quantum Dot"
     * Output: "Television (TV, flat-screen display). Electronic device for viewing video content. 65-inch QLED display with 4K resolution. Smart TV with streaming capabilities and voice control. Home entertainment system."
     *
     * @private
     */
    private generateProductSummary;
    /**
     * Stage 1: Select 2 most relevant L1 (top-level) categories.
     *
     * This stage performs the first major narrowing of the taxonomy space from
     * 5,597 total leaf categories down to typically 600-1200 leaves by selecting
     * the 2 most relevant top-level categories.
     *
     * WHY L1 SELECTION FIRST?
     * - Google taxonomy has exactly 21 L1 categories (Electronics, Home & Garden, etc.)
     * - Each L1 contains vastly different numbers of leaves:
     *   - Electronics: 339 leaves
     *   - Home & Garden: 903 leaves
     *   - Animals & Pet Supplies: ~100 leaves
     * - Selecting 2 L1s captures 99% of products (some span categories)
     * - Dramatically reduces search space for Stage 2
     *
     * WHY EXACTLY 2 CATEGORIES?
     * - 1 is too restrictive (misses cross-category products)
     * - 3+ wastes API calls on unlikely categories
     * - Testing showed 2 captures the primary and secondary categories effectively
     *
     * PROMPT DESIGN:
     * - Lists all 21 L1 categories (manageable list size)
     * - Uses "one category per line" format for clean parsing
     * - No numeric selection needed (L1 names are simple, unique)
     *
     * @param productSummary - The AI-generated product summary from Stage 0
     * @returns Array of 1-2 L1 category names
     * @throws {Error} If API call fails (no fallback to maintain quality)
     *
     * @example
     * Summary: "Television (TV, flat-screen display)..."
     * Returns: ["Electronics", "Home & Garden"]
     *
     * @private
     */
    private stage1SelectL1Categories;
    /**
     * Stage 2: Select leaf nodes from chosen L1 categories using batch processing.
     *
     * This is the most complex stage, implementing a sophisticated batch processing
     * system to handle L1 categories with hundreds of leaf nodes.
     *
     * BATCH PROCESSING ARCHITECTURE:
     * - Divides leaves into batches of 100 (configurable)
     * - Each batch allows up to 15 selections
     * - Total possible selections: batches × 15 (e.g., 4 batches = 60 selections)
     * - Processes batches sequentially to avoid overwhelming the AI
     *
     * NUMERIC SELECTION STRATEGY:
     * - Categories numbered 1-N within each batch
     * - AI returns numbers only: "3\n47\n89"
     * - Prevents hallucination of category names
     * - Simple validation: 1 ≤ number ≤ batch_size
     *
     * IMPORTANT PROMPT ENGINEERING:
     * - Explicitly warns about main products vs accessories
     * - Examples: "TV" → "Televisions" NOT "TV Mounts"
     * - Critical for accuracy - many products have accessory categories
     *
     * STAGE 2A vs 2B:
     * - 2A: Processes first L1 category (primary classification)
     * - 2B: Processes second L1 if selected (cross-category products)
     * - 2B excludes leaves already selected in 2A to avoid duplicates
     *
     * @param productSummary - The AI-generated product summary
     * @param selectedL1s - Array of L1 categories from Stage 1
     * @param excludedLeaves - Leaves to exclude (used in Stage 2B)
     * @param stageName - "Stage 2A" or "Stage 2B" for logging
     * @returns Array of selected leaf category names
     * @throws {Error} If any batch fails (maintains data quality)
     *
     * @example
     * // Stage 2A for "Electronics" with 339 leaves:
     * // Batch 1/4: categories 1-100
     * // Batch 2/4: categories 101-200
     * // Batch 3/4: categories 201-300
     * // Batch 4/4: categories 301-339
     * // Returns: ["Televisions", "TV Mounts", "Remote Controls", ...]
     *
     * @private
     */
    private stage2SelectLeaves;
    /**
     * Stage 3: Final selection from all candidate leaves.
     *
     * This is the decision stage where the system makes its final category selection
     * from the pre-filtered candidates gathered in Stages 2A and 2B.
     *
     * KEY DIFFERENCES FROM EARLIER STAGES:
     * - Uses gpt-4.1-mini (more capable model) vs nano for stages 0-2
     * - Receives full product summary (not truncated)
     * - Smaller candidate pool (typically 5-30 options)
     * - Single selection only (the best match)
     *
     * PROMPT STRATEGY:
     * - Emphasizes "MOST LIKELY" match over perfect match
     * - Acknowledges categories may not be perfect fits
     * - Encourages decisive selection when uncertain
     * - Uses phrases like "feels most probable" to reduce AI hesitation
     *
     * WHY A SEPARATE FINAL STAGE?
     * - Stage 2 casts a wide net (up to 60 categories)
     * - Stage 3 makes nuanced final decision
     * - Better model can distinguish subtle differences
     * - Single API call with all candidates prevents batch inconsistencies
     *
     * SKIP OPTIMIZATION:
     * - If only 1 leaf found in Stage 2, Stage 3 is skipped
     * - Saves API call and reduces latency
     * - No decision needed when there's only one option
     *
     * @param productSummary - The AI-generated product summary
     * @param leaves - Array of all candidate leaf categories from Stage 2
     * @returns Zero-based index of the selected category
     * @throws {Error} If selection fails or returns invalid number
     *
     * @example
     * // Input: ["Televisions", "Computer Monitors", "Projector Screens"]
     * // AI sees:
     * // 1. Televisions
     * // 2. Computer Monitors
     * // 3. Projector Screens
     * // Returns: 0 (if "Televisions" selected)
     *
     * @private
     */
    private stage3FinalSelection;
    /**
     * Call OpenAI API with error handling and rate limiting considerations.
     *
     * This is the core method that handles all AI interactions, implementing
     * critical settings to ensure consistent, deterministic results.
     *
     * DETERMINISTIC SETTINGS (Critical for consistency):
     * - temperature: 0 (no randomness)
     * - top_p: 0 (no nucleus sampling)
     * - These settings ensure the same input always produces the same output
     * - Essential for debugging and quality assurance
     *
     * MODEL SELECTION:
     * - Default: gpt-4.1-nano (fast, cheap, good for most stages)
     * - Stage 3: gpt-4.1-mini (more capable for final decisions)
     * - Model can be overridden via parameter
     *
     * API CALL TRACKING:
     * - Increments apiCallCount for cost monitoring
     * - Useful for optimization and budgeting
     * - Typical classification: 3-20 calls total
     *
     * RATE LIMITING (Commented out for basic version):
     * - Production systems should implement rate limiting
     * - OpenAI enforces per-second limits by tier
     * - Prevents 429 errors and ensures stability
     *
     * ERROR HANDLING:
     * - No retries in basic version (fail fast principle)
     * - Returns empty string if no content (defensive programming)
     * - Caller responsible for handling errors
     *
     * @param systemPrompt - Sets the AI's role and behavior
     * @param userPrompt - The actual classification request
     * @param maxTokens - Maximum response length (default: 150)
     * @param model - Optional model override (default: config.model)
     * @returns The AI's response as a string
     * @throws {Error} If API call fails
     *
     * @private
     */
    private callOpenAI;
    /**
     * Build taxonomy tree from file.
     *
     * Parses the Google Product Taxonomy text file and constructs both a hierarchical
     * tree structure and a flat array of paths for efficient searching.
     *
     * FILE FORMAT:
     * ```
     * # Google_Product_Taxonomy_Version: 2021-09-21
     * Animals & Pet Supplies
     * Animals & Pet Supplies > Live Animals
     * Animals & Pet Supplies > Pet Supplies
     * Animals & Pet Supplies > Pet Supplies > Bird Supplies
     * ```
     *
     * PARSING STRATEGY:
     * 1. Skip header line (starts with #)
     * 2. Split each line by " > " to get hierarchy parts
     * 3. Determine if leaf by checking if any subsequent line extends this path
     * 4. Build both tree and flat array simultaneously
     *
     * LEAF DETECTION ALGORITHM:
     * - A node is a leaf if no other line starts with its full path + " > "
     * - This correctly identifies ~5,597 leaf categories
     * - Non-leaf nodes are intermediate categories
     *
     * DATA STRUCTURES BUILT:
     * 1. Tree (this.taxonomy): Hierarchical representation
     *    - Used for tree traversal operations
     *    - Each node has children map and leaf status
     *
     * 2. Flat array (this.allPaths): Array of path objects
     *    - Primary structure for classification
     *    - Enables fast filtering by L1, leaf status
     *    - More efficient than tree traversal
     *
     * WHY BOTH STRUCTURES?
     * - Tree: Natural for hierarchical operations
     * - Array: Faster for filtering, searching, iteration
     * - Memory trade-off worth the performance gain
     *
     * @returns Root node of the taxonomy tree
     * @throws {Error} If file cannot be read
     *
     * @private
     */
    private buildTaxonomyTree;
    /**
     * Add a path to the taxonomy tree
     */
    private addToTree;
    /**
     * Convert leaf names to full taxonomy paths
     */
    private convertLeavesToPaths;
    /**
     * Create error result
     */
    private createErrorResult;
}
//# sourceMappingURL=TaxonomyNavigator.d.ts.map