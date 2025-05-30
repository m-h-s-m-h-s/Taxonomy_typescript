"use strict";
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
exports.getApiKey = getApiKey;
exports.validateApiKeyFormat = validateApiKeyFormat;
exports.setupApiKeyFile = setupApiKeyFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Simple logger for this module
const logger = {
    debug: (msg) => console.debug(`[config] ${msg}`),
    info: (msg) => console.info(`[config] ${msg}`),
    warning: (msg) => console.warn(`[config] ${msg}`),
    error: (msg) => console.error(`[config] ${msg}`)
};
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
function getApiKey(providedKey) {
    logger.debug("Attempting to retrieve OpenAI API key from available sources");
    // Priority 1: Direct argument (highest precedence)
    // This allows programmatic override and is useful for testing
    if (providedKey) {
        logger.debug("API key provided as direct argument");
        return providedKey;
    }
    // Priority 2: Environment variable
    // This is the recommended approach for production deployments
    // as it keeps secrets out of code and configuration files
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
        logger.debug("API key found in environment variable OPENAI_API_KEY");
        return envKey;
    }
    // Priority 3: Local file (lowest precedence)
    // This is convenient for development but should not be used in production
    try {
        // Construct path to api_key.txt relative to this file's location
        const currentDir = __dirname;
        const apiKeyFile = path.normalize(path.join(currentDir, '..', '..', 'data', 'api_key.txt'));
        if (fs.existsSync(apiKeyFile)) {
            logger.debug(`Found API key file at: ${apiKeyFile}`);
            const key = fs.readFileSync(apiKeyFile, 'utf-8').trim();
            if (key) {
                logger.debug("API key successfully read from file");
                return key;
            }
            else {
                logger.warning("API key file exists but is empty");
            }
        }
        else {
            logger.debug(`API key file not found at: ${apiKeyFile}`);
        }
    }
    catch (error) {
        logger.warning(`Error reading API key file: ${error}`);
    }
    // No API key found from any source
    logger.warning("No OpenAI API key found from any source");
    logger.info("API key sources checked:");
    logger.info("1. Direct argument: Not provided");
    logger.info("2. Environment variable OPENAI_API_KEY: Not set");
    logger.info("3. File data/api_key.txt: Not found or empty");
    return null;
}
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
function validateApiKeyFormat(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
        return false;
    }
    // OpenAI API keys start with 'sk-' and are typically 51+ characters
    if (!apiKey.startsWith('sk-')) {
        return false;
    }
    if (apiKey.length < 20) { // Minimum reasonable length
        return false;
    }
    return true;
}
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
function setupApiKeyFile(apiKey, overwrite = false) {
    if (!validateApiKeyFormat(apiKey)) {
        throw new Error("Invalid API key format. OpenAI keys should start with 'sk-'");
    }
    // Determine file path
    const currentDir = __dirname;
    const dataDir = path.normalize(path.join(currentDir, '..', '..', 'data'));
    const apiKeyFile = path.join(dataDir, 'api_key.txt');
    // Check if file exists and handle overwrite logic
    if (fs.existsSync(apiKeyFile) && !overwrite) {
        throw new Error(`API key file already exists at ${apiKeyFile}. Use overwrite=true to replace it.`);
    }
    try {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        // Write the API key
        fs.writeFileSync(apiKeyFile, apiKey, 'utf-8');
        logger.info(`API key file created at: ${apiKeyFile}`);
        return true;
    }
    catch (error) {
        logger.error(`Failed to create API key file: ${error}`);
        return false;
    }
}
//# sourceMappingURL=config.js.map