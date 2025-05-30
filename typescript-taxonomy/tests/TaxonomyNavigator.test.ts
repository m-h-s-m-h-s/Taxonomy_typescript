/**
 * Unit Tests for TaxonomyNavigator
 * 
 * This test suite validates the core functionality of the TaxonomyNavigator class,
 * which is responsible for classifying products into Google's taxonomy categories.
 * 
 * TEST STRATEGY:
 * - Mock all external dependencies (OpenAI API, file system)
 * - Test each public method with various inputs
 * - Verify error handling and edge cases
 * - Ensure performance metrics are tracked correctly
 * 
 * MOCKING APPROACH:
 * - OpenAI API calls are mocked to avoid actual API usage and costs
 * - File system operations are mocked for predictable test data
 * - This allows tests to run quickly and deterministically
 * 
 * NOTE: These tests require Jest to be installed:
 * npm install --save-dev jest @types/jest ts-jest
 */

import { TaxonomyNavigator } from '../src/TaxonomyNavigator';
import { TaxonomyNavigatorConfig } from '../src/types';
import * as fs from 'fs';

/**
 * Mock the OpenAI module to prevent actual API calls during testing.
 * 
 * This mock:
 * - Replaces the real OpenAI constructor with a mock function
 * - Returns predictable responses for all API calls
 * - Allows us to test our logic without external dependencies
 * 
 * In real tests, you would make this mock more sophisticated to
 * return different responses based on the input prompts.
 */
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'Mocked response'
              }
            }]
          })
        }
      }
    }))
  };
});

/**
 * Main test suite for TaxonomyNavigator
 * 
 * Organized into logical groups:
 * 1. Constructor tests - initialization and configuration
 * 2. classifyProduct tests - main functionality
 * 3. Stage Details tests - verbose output validation
 */
describe('TaxonomyNavigator', () => {
  // Shared test instance
  let navigator: TaxonomyNavigator;
  
  /**
   * Mock taxonomy data representing a minimal taxonomy structure.
   * In real tests, this would be more comprehensive.
   * 
   * Format: "L1 > L2 > ... > Leaf"
   * Each line represents a complete path from root to leaf category
   */
  const mockTaxonomyData = `Electronics > Cell Phones > Smartphones
Electronics > Computers > Laptops
Apparel & Accessories > Shoes > Athletic Shoes
Home & Garden > Kitchen & Dining > Kitchen Appliances > Blenders`;

  /**
   * Setup before each test:
   * - Mock file system to return our test taxonomy data
   * - Mock file existence checks to return true
   * - This ensures consistent test environment
   */
  beforeEach(() => {
    // Mock file system for taxonomy file
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockTaxonomyData);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  /**
   * Cleanup after each test:
   * - Restore all mocks to their original state
   * - Prevents test pollution
   */
  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Constructor Test Suite
   * 
   * Tests various ways to initialize the TaxonomyNavigator:
   * - Default configuration
   * - Custom configuration
   * - Error cases (missing files)
   */
  describe('constructor', () => {
    /**
     * Test: Default initialization
     * 
     * Verifies that TaxonomyNavigator can be created with no parameters,
     * using all default configuration values.
     */
    it('should initialize with default configuration', () => {
      navigator = new TaxonomyNavigator();
      expect(navigator).toBeDefined();
    });

    /**
     * Test: Custom configuration
     * 
     * Verifies that custom configuration options are accepted and applied.
     * Tests common customization scenarios like:
     * - Disabling logging for production
     * - Using different AI models
     * - Providing API key directly
     */
    it('should accept custom configuration', () => {
      const config: TaxonomyNavigatorConfig = {
        enableLogging: false,      // Disable console output
        model: 'gpt-3.5-turbo',   // Use cheaper model
        apiKey: 'test-key'        // Provide API key directly
      };
      navigator = new TaxonomyNavigator(config);
      expect(navigator).toBeDefined();
    });

    /**
     * Test: Missing taxonomy file
     * 
     * Verifies proper error handling when the taxonomy file doesn't exist.
     * This is a critical error that should fail fast with clear message.
     */
    it('should throw error if taxonomy file not found', () => {
      // Mock file system to simulate missing file
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      // Expect constructor to throw with specific message
      expect(() => new TaxonomyNavigator()).toThrow('Taxonomy file not found');
    });
  });

  /**
   * classifyProduct Test Suite
   * 
   * Tests the main classification functionality:
   * - Successful classification
   * - Error handling
   * - Performance tracking
   * - API call counting
   */
  describe('classifyProduct', () => {
    /**
     * Setup for classification tests:
     * - Create navigator instance with test configuration
     * - Disable logging to keep test output clean
     * - Provide test API key
     */
    beforeEach(() => {
      navigator = new TaxonomyNavigator({
        enableLogging: false,
        apiKey: 'test-key'
      });
    });

    /**
     * Test: Successful classification
     * 
     * Verifies that classifyProduct returns all expected fields
     * in the result object when classification succeeds.
     */
    it('should return a classification result', async () => {
      const result = await navigator.classifyProduct('iPhone 14: Smartphone');
      
      // Verify all required fields are present
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('bestMatch');
      expect(result).toHaveProperty('leafCategory');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('apiCalls');
    });

    /**
     * Test: Empty input handling
     * 
     * Verifies that empty product descriptions are handled gracefully
     * with appropriate error response.
     */
    it('should handle empty input', async () => {
      const result = await navigator.classifyProduct('');
      
      // Should fail with error message
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    /**
     * Test: API call tracking
     * 
     * Verifies that the system correctly counts the number of
     * API calls made during classification. This is important
     * for cost estimation and optimization.
     */
    it('should track API calls', async () => {
      const result = await navigator.classifyProduct('Test product');
      
      // Should make at least 1 API call (for summary generation)
      expect(result.apiCalls).toBeGreaterThan(0);
    });

    /**
     * Test: Processing time measurement
     * 
     * Verifies that processing time is measured and reported.
     * This helps users understand performance characteristics.
     */
    it('should measure processing time', async () => {
      const result = await navigator.classifyProduct('Test product');
      
      // Processing time should be positive number
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  /**
   * Stage Details Test Suite
   * 
   * Tests the verbose output mode that provides detailed
   * information about each classification stage.
   */
  describe('Stage Details', () => {
    /**
     * Test: Verbose stage information
     * 
     * When enableLogging is true, the result should include
     * detailed information about what happened at each stage
     * of the classification process.
     */
    it('should include stage details when requested', async () => {
      // Create navigator with logging enabled
      navigator = new TaxonomyNavigator({
        enableLogging: true,
        apiKey: 'test-key'
      });

      const result = await navigator.classifyProduct('Laptop computer');
      
      // Verify stage details are included
      if (result.stageDetails) {
        // Check all stage information is present
        expect(result.stageDetails).toHaveProperty('aiSummary');
        expect(result.stageDetails).toHaveProperty('stage1L1Categories');
        expect(result.stageDetails).toHaveProperty('stage2aLeaves');
        expect(result.stageDetails).toHaveProperty('totalCandidates');
      }
    });
  });
});

/**
 * Additional Test Cases to Implement:
 * 
 * 1. Rate Limiting Tests
 *    - Verify requests are throttled correctly
 *    - Test behavior when rate limit is exceeded
 * 
 * 2. Model Configuration Tests
 *    - Test different models for different stages
 *    - Verify model fallback behavior
 * 
 * 3. Batch Processing Tests
 *    - Test Stage 2 batch size limits
 *    - Verify correct aggregation of batch results
 * 
 * 4. Edge Cases
 *    - Products with no matching categories
 *    - Ambiguous products matching multiple categories
 *    - Very long product descriptions
 * 
 * 5. Integration Tests (separate file)
 *    - Test with real OpenAI API (expensive, run sparingly)
 *    - Test with full Google taxonomy file
 *    - Benchmark performance with various product types
 */ 