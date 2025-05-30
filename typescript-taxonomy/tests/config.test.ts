/**
 * Unit Tests for Config Module
 * 
 * This test suite validates the configuration module, specifically the
 * getApiKey function which handles API key retrieval from multiple sources.
 * 
 * API KEY PRIORITY (tested here):
 * 1. Direct parameter (highest priority)
 * 2. Environment variable OPENAI_API_KEY
 * 3. File data/api_key.txt
 * 4. Return null if not found
 * 
 * WHY THIS MATTERS:
 * - Flexibility for different deployment scenarios
 * - Security (don't hardcode keys)
 * - Developer convenience (multiple options)
 * 
 * TEST APPROACH:
 * - Mock file system to simulate different scenarios
 * - Manipulate environment variables safely
 * - Test each priority level in isolation
 * 
 * NOTE: These tests require Jest to be installed:
 * npm install --save-dev jest @types/jest ts-jest
 */

import { getApiKey } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Config Module Test Suite
 * 
 * Tests the configuration utilities, focusing on API key management.
 * These tests ensure that API keys can be loaded from various sources
 * with proper priority and error handling.
 */
describe('Config Module', () => {
  /**
   * Store original environment to restore after tests.
   * This prevents test pollution affecting other tests or the system.
   */
  const originalEnv = process.env;

  /**
   * Setup before each test:
   * - Reset Node.js module cache (important for config modules)
   * - Create clean environment copy
   * - Remove any existing OPENAI_API_KEY to start fresh
   * 
   * This ensures each test starts with predictable state.
   */
  beforeEach(() => {
    // Reset environment
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
  });

  /**
   * Cleanup after each test:
   * - Restore original environment
   * - Restore all Jest mocks
   * 
   * This prevents tests from affecting each other.
   */
  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  /**
   * getApiKey Test Suite
   * 
   * Tests the API key retrieval function with various scenarios:
   * - Different sources (parameter, env, file)
   * - Priority order
   * - Error conditions
   * - Edge cases (whitespace, missing files)
   */
  describe('getApiKey', () => {
    /**
     * Test: Direct parameter has highest priority
     * 
     * When an API key is provided directly as a parameter,
     * it should be returned immediately without checking
     * other sources. This is useful for:
     * - Testing with temporary keys
     * - Overriding configuration
     * - Programmatic key injection
     */
    it('should return provided API key as first priority', () => {
      const providedKey = 'sk-provided-key';
      const result = getApiKey(providedKey);
      expect(result).toBe(providedKey);
    });

    /**
     * Test: Environment variable as second priority
     * 
     * If no key is provided directly, check the OPENAI_API_KEY
     * environment variable. This is the recommended approach for:
     * - Production deployments
     * - CI/CD pipelines
     * - Docker containers
     * - Security (no files to accidentally commit)
     */
    it('should return environment variable as second priority', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key';
      const result = getApiKey();
      expect(result).toBe('sk-env-key');
    });

    /**
     * Test: File-based key as third priority
     * 
     * If no key in env, check data/api_key.txt file.
     * This is convenient for:
     * - Local development
     * - Quick setup
     * - Non-technical users
     * 
     * File should be in .gitignore to prevent accidental commits.
     */
    it('should read from file as third priority', () => {
      const fileKey = 'sk-file-key';
      // Mock file system to simulate file exists with content
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(fileKey);
      
      const result = getApiKey();
      expect(result).toBe(fileKey);
    });

    /**
     * Test: No API key found
     * 
     * When no API key is found in any source, return null.
     * The calling code should handle this gracefully with
     * a helpful error message.
     * 
     * This tests the fallback behavior when:
     * - No parameter provided
     * - No environment variable set
     * - No file exists
     */
    it('should return null if no API key found', () => {
      // Mock file system to simulate missing file
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const result = getApiKey();
      expect(result).toBeNull();
    });

    /**
     * Test: Whitespace handling
     * 
     * API keys from files often have trailing newlines or spaces.
     * The function should trim these automatically to prevent
     * authentication failures.
     * 
     * Common scenarios:
     * - Copy/paste adds newline
     * - Text editors add trailing newline
     * - Accidental spaces when typing
     */
    it('should trim whitespace from file-based key', () => {
      const fileKey = '  sk-file-key-with-spaces  \n';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(fileKey);
      
      const result = getApiKey();
      // Should trim to just the key
      expect(result).toBe('sk-file-key-with-spaces');
    });

    /**
     * Test: File read error handling
     * 
     * Various file system errors can occur:
     * - Permission denied
     * - File locked by another process
     * - Disk error
     * - Network drive unavailable
     * 
     * The function should handle these gracefully by
     * returning null rather than crashing.
     */
    it('should handle file read errors gracefully', () => {
      // Mock file exists but reading fails
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const result = getApiKey();
      // Should return null, not throw
      expect(result).toBeNull();
    });
  });
});

/**
 * Additional Test Cases to Implement:
 * 
 * 1. Path Resolution Tests
 *    - Test relative vs absolute paths
 *    - Test path resolution from different working directories
 *    - Test Windows vs Unix path separators
 * 
 * 2. API Key Validation Tests
 *    - Verify key format (starts with 'sk-')
 *    - Check key length
 *    - Reject obviously invalid keys
 * 
 * 3. Multiple Config Files
 *    - Support for .env files
 *    - Config file hierarchy
 *    - Environment-specific configs (dev, prod, test)
 * 
 * 4. Security Tests
 *    - Ensure keys aren't logged
 *    - Verify keys aren't included in error messages
 *    - Test secure key storage recommendations
 * 
 * 5. Performance Tests
 *    - Cache file reads to avoid repeated I/O
 *    - Benchmark config loading time
 *    - Test with large config files
 */ 