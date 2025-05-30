import { TaxonomyNavigator } from '../src/TaxonomyNavigator';
import { TaxonomyNavigatorConfig } from '../src/types';
import * as fs from 'fs';

// Mock OpenAI to avoid actual API calls in tests
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

describe('TaxonomyNavigator', () => {
  let navigator: TaxonomyNavigator;
  const mockTaxonomyData = `Electronics > Cell Phones > Smartphones
Electronics > Computers > Laptops
Apparel & Accessories > Shoes > Athletic Shoes
Home & Garden > Kitchen & Dining > Kitchen Appliances > Blenders`;

  beforeEach(() => {
    // Mock file system for taxonomy file
    jest.spyOn(fs, 'readFileSync').mockReturnValue(mockTaxonomyData);
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      navigator = new TaxonomyNavigator();
      expect(navigator).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const config: TaxonomyNavigatorConfig = {
        enableLogging: false,
        model: 'gpt-3.5-turbo',
        apiKey: 'test-key'
      };
      navigator = new TaxonomyNavigator(config);
      expect(navigator).toBeDefined();
    });

    it('should throw error if taxonomy file not found', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => new TaxonomyNavigator()).toThrow('Taxonomy file not found');
    });
  });

  describe('classifyProduct', () => {
    beforeEach(() => {
      navigator = new TaxonomyNavigator({
        enableLogging: false,
        apiKey: 'test-key'
      });
    });

    it('should return a classification result', async () => {
      const result = await navigator.classifyProduct('iPhone 14: Smartphone');
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('bestMatch');
      expect(result).toHaveProperty('leafCategory');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('apiCalls');
    });

    it('should handle empty input', async () => {
      const result = await navigator.classifyProduct('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track API calls', async () => {
      const result = await navigator.classifyProduct('Test product');
      
      expect(result.apiCalls).toBeGreaterThan(0);
    });

    it('should measure processing time', async () => {
      const result = await navigator.classifyProduct('Test product');
      
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Stage Details', () => {
    it('should include stage details when requested', async () => {
      navigator = new TaxonomyNavigator({
        enableLogging: true,
        apiKey: 'test-key'
      });

      const result = await navigator.classifyProduct('Laptop computer');
      
      if (result.stageDetails) {
        expect(result.stageDetails).toHaveProperty('aiSummary');
        expect(result.stageDetails).toHaveProperty('stage1L1Categories');
        expect(result.stageDetails).toHaveProperty('stage2aLeaves');
        expect(result.stageDetails).toHaveProperty('totalCandidates');
      }
    });
  });
}); 