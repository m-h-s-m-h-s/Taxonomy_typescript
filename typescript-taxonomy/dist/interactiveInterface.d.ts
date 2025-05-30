/**
 * Interactive command-line interface for the Taxonomy Navigator.
 *
 * This module provides a user-friendly way to test the classification
 * system interactively, allowing real-time product categorization with
 * detailed feedback about the process.
 *
 * FEATURES:
 * - Interactive product input
 * - Detailed stage-by-stage results
 * - Performance metrics (time, API calls)
 * - Graceful exit handling
 * - Error display with suggestions
 *
 * USE CASES:
 * - Testing and debugging the classification system
 * - Demonstrating capabilities to stakeholders
 * - Quick ad-hoc product categorization
 * - Understanding the multi-stage process
 *
 * DESIGN DECISIONS:
 * - Uses readline for cross-platform compatibility
 * - Shows intermediate results for transparency
 * - Formats output with emojis for clarity
 * - Handles Ctrl+C gracefully
 */
interface SessionResult {
    timestamp: string;
    productInfo: string;
    bestMatch: string;
    bestPath: string[];
    allCandidates: string[];
    processingTimeSeconds: number;
    success: boolean;
    error?: string;
}
export declare class TaxonomyInterface {
    private navigator;
    private saveResults;
    private outputFile;
    private sessionResults;
    private rl;
    constructor(taxonomyFile?: string, apiKey?: string, model?: string, saveResults?: boolean, outputFile?: string);
    displayWelcome(): void;
    displayHelp(): void;
    displayStats(): void;
    clearScreen(): void;
    classifyProduct(productInfo: string): Promise<SessionResult>;
    private saveResultToFile;
    private prompt;
    run(): Promise<void>;
}
export declare function main(): Promise<void>;
export {};
//# sourceMappingURL=interactiveInterface.d.ts.map