/**
 * Configuration utilities for the Taxonomy Navigator.
 *
 * This module handles API key management with multiple fallback sources,
 * ensuring flexibility for different deployment environments while maintaining
 * security best practices.
 *
 * API KEY SOURCES (in order of precedence):
 * 1. Direct parameter (for programmatic use)
 * 2. OPENAI_API_KEY environment variable (for cloud deployments)
 * 3. api_key.txt file (for local development)
 *
 * SECURITY CONSIDERATIONS:
 * - Never commit api_key.txt to version control (.gitignore it)
 * - Use environment variables in production
 * - Direct parameter useful for testing with temporary keys
 *
 * FILE PATH RESOLUTION:
 * - Looks for api_key.txt in multiple locations
 * - Handles both development and npm package scenarios
 * - Gracefully handles missing files
 */
/**
 * Retrieves the OpenAI API key from multiple sources.
 *
 * This function implements a flexible fallback system for API key retrieval,
 * accommodating different deployment scenarios while maintaining security.
 *
 * LOOKUP STRATEGY:
 * 1. If provided directly, validate and return it
 * 2. Check OPENAI_API_KEY environment variable
 * 3. Search for api_key.txt in multiple locations:
 *    - Current working directory + /data/
 *    - Current working directory + /typescript-taxonomy/data/
 *    - Script directory + /data/
 *    - Parent of script directory + /data/
 *
 * FILE SEARCH RATIONALE:
 * - Multiple paths handle different execution contexts
 * - Works when run from project root or subdirectories
 * - Works when installed as npm package
 * - Handles TypeScript vs compiled JavaScript locations
 *
 * ERROR HANDLING:
 * - Returns null if no key found (caller must handle)
 * - File read errors are caught and ignored (security)
 * - Empty strings treated as missing
 *
 * @param providedKey - Optional API key provided directly
 * @returns The API key if found, null otherwise
 *
 * @example
 * ```typescript
 * // Direct usage
 * const key = getApiKey('sk-...');
 *
 * // With environment variable
 * process.env.OPENAI_API_KEY = 'sk-...';
 * const key = getApiKey();
 *
 * // With api_key.txt file
 * const key = getApiKey(); // reads from file
 * ```
 */
export declare function getApiKey(providedKey?: string): string | null;
/**
 * Validate that an API key has the expected OpenAI format.
 *
 * OpenAI API keys typically start with 'sk-' followed by a long string
 * of characters. This function performs basic format validation.
 *
 * @param apiKey - The API key to validate
 * @returns True if the key appears to have valid format, false otherwise
 *
 * Note:
 * This only validates format, not whether the key is actually valid
 * with OpenAI's servers. A properly formatted key may still be expired
 * or invalid.
 */
export declare function validateApiKeyFormat(apiKey: string | null | undefined): boolean;
/**
 * Create or update the API key file for development use.
 *
 * This utility function helps set up the local API key file for development.
 * It includes safety checks to prevent accidental overwrites.
 *
 * @param apiKey - The API key to write to the file
 * @param overwrite - Whether to overwrite existing file. Defaults to false.
 * @returns True if file was created/updated successfully, false otherwise
 * @throws Error if API key format is invalid
 * @throws Error if file exists and overwrite=false
 *
 * @example
 * ```typescript
 * // Set up API key file for development
 * setupApiKeyFile("sk-your-key-here", true);
 * ```
 */
export declare function setupApiKeyFile(apiKey: string, overwrite?: boolean): boolean;
//# sourceMappingURL=config.d.ts.map