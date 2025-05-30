/**
 * Configuration Management for Taxonomy Navigator
 * 
 * This module provides configuration functions for the Taxonomy Navigator system.
 * Currently includes API key management with multiple fallback options.
 * 
 * Author: AI Assistant
 * Version: 2.0 (TypeScript port)
 * Last Updated: 2025-01-29
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Simple logger for this module
const logger = {
  debug: (msg: string) => console.debug(`[config] ${msg}`),
  info: (msg: string) => console.info(`[config] ${msg}`),
  warning: (msg: string) => console.warn(`[config] ${msg}`),
  error: (msg: string) => console.error(`[config] ${msg}`)
};

/**
 * Retrieve OpenAI API key from multiple sources with fallback hierarchy.
 * 
 * This function implements a secure and flexible approach to API key management
 * by checking multiple sources in order of precedence. This allows users to
 * provide the API key in the most convenient way for their setup.
 * 
 * The search order is designed for security and convenience:
 * 1. Direct argument (highest precedence) - for programmatic use
 * 2. Environment variable - for secure server deployments
 * 3. Local file - for development convenience
 * 
 * @param apiKeyArg - API key provided directly as a function argument.
 *                    This takes highest precedence if provided.
 * @returns The OpenAI API key if found, null if no key is available from any source.
 * 
 * @example
 * ```typescript
 * // Try to get API key with fallback
 * const apiKey = getApiKey();
 * if (!apiKey) {
 *   throw new Error("No API key found");
 * }
 * 
 * // Or provide directly
 * const apiKey = getApiKey("sk-...");
 * ```
 * 
 * Security Notes:
 * - Environment variables are preferred for production deployments
 * - Local files should only be used in development environments
 * - Never commit API keys to version control
 * - The api_key.txt file is in .gitignore to prevent accidental commits
 */
export function getApiKey(apiKeyArg?: string): string | null {
  logger.debug("Attempting to retrieve OpenAI API key from available sources");
  
  // Priority 1: Direct argument (highest precedence)
  // This allows programmatic override and is useful for testing
  if (apiKeyArg) {
    logger.debug("API key provided as direct argument");
    return apiKeyArg;
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
      } else {
        logger.warning("API key file exists but is empty");
      }
    } else {
      logger.debug(`API key file not found at: ${apiKeyFile}`);
    }
  } catch (error) {
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
export function validateApiKeyFormat(apiKey: string | null | undefined): boolean {
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
export function setupApiKeyFile(apiKey: string, overwrite: boolean = false): boolean {
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
  } catch (error) {
    logger.error(`Failed to create API key file: ${error}`);
    return false;
  }
} 