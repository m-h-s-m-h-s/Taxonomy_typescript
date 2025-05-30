/**
 * TypeScript implementation of the Taxonomy Navigator
 * 
 * This is a port of the Python taxonomy navigation system that uses a 5-stage
 * AI-powered classification process to categorize products into Google Product
 * Taxonomy categories.
 * 
 * Version: 1.0 (TypeScript port)
 * Based on Python version 12.5
 */

import { readFileSync } from 'fs';
import OpenAI from 'openai';
import { 
  TaxonomyNode, 
  TaxonomyPath, 
  ClassificationResult, 
  TaxonomyNavigatorConfig,
  BatchProcessingOptions
} from './types';
import { getApiKey } from './config';

export class TaxonomyNavigator {
  private taxonomy: TaxonomyNode;
  private allPaths: TaxonomyPath[] = [];
  private openai: OpenAI;
  private config: Required<TaxonomyNavigatorConfig>;
  private apiCallCount = 0;

  // Default configuration
  private static readonly DEFAULT_CONFIG: Required<TaxonomyNavigatorConfig> = {
    taxonomyFile: './data/taxonomy.en-US.txt',
    apiKey: '',  // Will be filled by getApiKey
    model: 'gpt-4-0125-preview', // Using gpt-4 as gpt-4.1-nano may not be available
    stage2Model: 'gpt-4-0125-preview',
    stage3Model: 'gpt-4-0125-preview',
    maxRetries: 3,
    enableLogging: true,
    rateLimit: {
      maxRequestsPerMinute: 60,
      maxRequestsPerDay: 10000
    }
  };

  // Batch processing configuration
  private static readonly BATCH_CONFIG: BatchProcessingOptions = {
    batchSize: 100,
    maxSelectionsPerBatch: 15
  };

  constructor(config: TaxonomyNavigatorConfig = {}) {
    this.config = { ...TaxonomyNavigator.DEFAULT_CONFIG, ...config };
    
    // Use getApiKey with fallback to config
    const apiKey = getApiKey(this.config.apiKey) || '';
    if (!apiKey) {
      throw new Error('OpenAI API key not provided. Please set it in api_key.txt, as an environment variable, or provide it as an argument.');
    }
    this.config.apiKey = apiKey;

    this.openai = new OpenAI({ apiKey: this.config.apiKey });
    this.taxonomy = this.buildTaxonomyTree();
    
    if (this.config.enableLogging) {
      console.log(`Initialized TaxonomyNavigator with ${this.allPaths.length} paths`);
      console.log(`Leaf nodes: ${this.allPaths.filter(p => p.isLeaf).length}`);
    }
  }

  /**
   * Main entry point for classifying a product
   */
  async classifyProduct(productInfo: string): Promise<ClassificationResult> {
    const startTime = Date.now();
    this.apiCallCount = 0;

    try {
      // Generate AI summary for stages 1-3
      const summary = await this.generateProductSummary(productInfo);
      this.log(`Generated summary: ${summary.substring(0, 100)}...`);

      // Stage 1: Select top 2 L1 categories
      const selectedL1s = await this.stage1SelectL1Categories(summary);
      this.log(`Stage 1 selected: ${selectedL1s.join(', ')}`);

      if (selectedL1s.length === 0) {
        return this.createErrorResult('No L1 categories selected', startTime);
      }

      // Stage 2A: Select leaves from first L1
      const leaves2A = await this.stage2SelectLeaves(summary, selectedL1s, [], 'Stage 2A');
      this.log(`Stage 2A found ${leaves2A.length} leaves`);

      // Stage 2B: Select leaves from second L1 (if applicable)
      let leaves2B: string[] = [];
      if (selectedL1s.length >= 2) {
        leaves2B = await this.stage2SelectLeaves(summary, selectedL1s.slice(1), leaves2A, 'Stage 2B');
        this.log(`Stage 2B found ${leaves2B.length} leaves`);
      }

      // Combine all leaves
      const allLeaves = [...leaves2A, ...leaves2B];
      
      if (allLeaves.length === 0) {
        return this.createErrorResult('No leaf categories found', startTime);
      }

      // Stage 3: Final selection (skip if only 1 leaf)
      let bestLeaf: string;
      let bestIndex = 0;
      
      if (allLeaves.length === 1) {
        bestLeaf = allLeaves[0];
        this.log('Stage 3 skipped - only one leaf found');
      } else {
        bestIndex = await this.stage3FinalSelection(summary, allLeaves);
        if (bestIndex < 0) {
          return this.createErrorResult('Final selection failed', startTime);
        }
        bestLeaf = allLeaves[bestIndex];
        this.log(`Stage 3 selected: ${bestLeaf}`);
      }

      // Convert to paths and return result
      const paths = this.convertLeavesToPaths(allLeaves);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        paths,
        bestMatchIndex: bestIndex,
        bestMatch: paths[bestIndex].join(' > '),
        leafCategory: bestLeaf,
        processingTime,
        apiCalls: this.apiCallCount
      };

    } catch (error) {
      return this.createErrorResult(error instanceof Error ? error.message : 'Unknown error', startTime);
    }
  }

  /**
   * Generate AI-powered product summary (40-60 words)
   */
  private async generateProductSummary(productInfo: string): Promise<string> {
    const prompt = `Summarize this product in 40-60 words to make its category crystal clear:
1. START with the EXACT common product name (e.g., "television" not "home entertainment display", "lipstick" not "lip color product")
2. Include 1-2 synonyms or alternative names in parentheses to clarify (e.g., "Television (TV, flat-screen display)")
3. Core function that defines its category
4. Key distinguishing features within that category
5. Primary use context

Use standard product names. Include clarifying synonyms. Be direct and specific.
IMPORTANT: Identify what the product IS, not what accessories it might need.

Product: ${productInfo}

Summary:`;

    try {
      const response = await this.callOpenAI(
        'You are a product categorization assistant. Always use the most common, standard product name. Include helpful synonyms in parentheses.',
        prompt,
        100
      );
      
      return response.trim();
    } catch (error) {
      this.log(`Summary generation failed, using truncated original: ${error}`);
      return productInfo.substring(0, 400);
    }
  }

  /**
   * Stage 1: Select 2 most relevant L1 categories
   */
  private async stage1SelectL1Categories(productSummary: string): Promise<string[]> {
    // Extract unique L1 categories
    const l1Categories = [...new Set(
      this.allPaths
        .filter(p => p.isLeaf)
        .map(p => p.parts[0])
    )];

    const prompt = `Product: ${productSummary}

Select exactly 2 categories from this list that best match the product:

${l1Categories.join('\n')}

Return one category per line:`;

    try {
      const response = await this.callOpenAI(
        'You are a product categorization assistant. Select L1 categories from the provided list using exact spelling.',
        prompt
      );

      // Parse and validate response
      const selected = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && l1Categories.includes(line))
        .slice(0, 2);

      return [...new Set(selected)]; // Remove duplicates
    } catch (error) {
      this.log(`Stage 1 failed: ${error}`);
      return [];
    }
  }

  /**
   * Stage 2: Select leaf nodes from chosen L1 categories using batch processing
   */
  private async stage2SelectLeaves(
    productSummary: string, 
    selectedL1s: string[], 
    excludedLeaves: string[],
    stageName: string
  ): Promise<string[]> {
    const targetL1 = selectedL1s[0];
    if (!targetL1) return [];

    // Get all leaves for this L1
    const l1Leaves = this.allPaths
      .filter(p => p.isLeaf && p.parts[0] === targetL1)
      .map(p => p.parts[p.parts.length - 1])
      .filter(leaf => !excludedLeaves.includes(leaf));

    if (l1Leaves.length === 0) return [];

    // Process in batches
    const allSelections: string[] = [];
    const batches = Math.ceil(l1Leaves.length / TaxonomyNavigator.BATCH_CONFIG.batchSize);

    for (let i = 0; i < batches; i++) {
      const start = i * TaxonomyNavigator.BATCH_CONFIG.batchSize;
      const end = Math.min(start + TaxonomyNavigator.BATCH_CONFIG.batchSize, l1Leaves.length);
      const batchLeaves = l1Leaves.slice(start, end);

      // Create numbered list for this batch
      const numberedOptions = batchLeaves
        .map((leaf, idx) => `${start + idx + 1}. ${leaf}`)
        .join('\n');

      const prompt = `Product: ${productSummary}

Select up to ${TaxonomyNavigator.BATCH_CONFIG.maxSelectionsPerBatch} categories that best match this product.
Return ONLY the numbers (one per line):

${numberedOptions}`;

      try {
        const response = await this.callOpenAI(
          'You are a product classifier. Return only numbers corresponding to matching categories.',
          prompt
        );

        // Parse numeric responses
        const numbers = response
          .split('\n')
          .map(line => parseInt(line.trim()))
          .filter(num => !isNaN(num) && num >= start + 1 && num <= end);

        // Convert numbers to leaf names
        const batchSelections = numbers.map(num => l1Leaves[num - 1]);
        allSelections.push(...batchSelections);

      } catch (error) {
        this.log(`Batch ${i + 1}/${batches} failed: ${error}`);
      }
    }

    return [...new Set(allSelections)]; // Remove duplicates
  }

  /**
   * Stage 3: Final selection from all candidate leaves
   */
  private async stage3FinalSelection(productSummary: string, leaves: string[]): Promise<number> {
    const numberedOptions = leaves
      .map((leaf, idx) => `${idx + 1}. ${leaf}`)
      .join('\n');

    const prompt = `You are categorizing this product:
${productSummary}

Select the ONE category that best matches the product.
These categories are all valid - choose the most specific and accurate match.

${numberedOptions}

Return ONLY the number:`;

    try {
      const response = await this.callOpenAI(
        'You are a product categorization expert. Select the single best matching category.',
        prompt
      );

      const number = parseInt(response.trim());
      if (!isNaN(number) && number >= 1 && number <= leaves.length) {
        return number - 1; // Convert to 0-based index
      }
      
      return -1;
    } catch (error) {
      this.log(`Stage 3 failed: ${error}`);
      return -1;
    }
  }

  /**
   * Call OpenAI API with error handling and rate limiting considerations
   */
  private async callOpenAI(
    systemPrompt: string, 
    userPrompt: string, 
    maxTokens: number = 150
  ): Promise<string> {
    this.apiCallCount++;
    
    // For robust version: Add rate limiting logic here
    // await this.checkRateLimit();
    
    const completion = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0,
      top_p: 0,
      max_tokens: maxTokens
    });

    return completion.choices[0]?.message?.content || '';
  }

  /**
   * Build taxonomy tree from file
   */
  private buildTaxonomyTree(): TaxonomyNode {
    const content = readFileSync(this.config.taxonomyFile!, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    
    const root: TaxonomyNode = {
      name: 'root',
      children: {},
      isLeaf: false
    };

    this.allPaths = [];

    lines.forEach((line, index) => {
      line = line.trim();
      if (!line) return;

      // Check if this is a leaf node
      const isLeaf = !lines.slice(index + 1).some(nextLine => 
        nextLine.trim().startsWith(line + ' > ')
      );

      const parts = line.split(' > ').map(p => p.trim());
      
      this.allPaths.push({
        fullPath: line,
        parts,
        isLeaf
      });

      // Add to tree
      this.addToTree(root, parts, isLeaf);
    });

    return root;
  }

  /**
   * Add a path to the taxonomy tree
   */
  private addToTree(tree: TaxonomyNode, parts: string[], isLeaf: boolean): void {
    let current = tree;
    
    parts.forEach((part, index) => {
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          children: {},
          isLeaf: index === parts.length - 1 && isLeaf
        };
      }
      current = current.children[part];
    });
  }

  /**
   * Convert leaf names to full taxonomy paths
   */
  private convertLeavesToPaths(leaves: string[]): string[][] {
    return leaves.map(leaf => {
      const path = this.allPaths.find(p => 
        p.isLeaf && p.parts[p.parts.length - 1] === leaf
      );
      return path ? path.parts : [leaf];
    });
  }

  /**
   * Create error result
   */
  private createErrorResult(error: string, startTime: number): ClassificationResult {
    return {
      success: false,
      paths: [['False']],
      bestMatchIndex: 0,
      bestMatch: 'False',
      leafCategory: 'False',
      processingTime: Date.now() - startTime,
      apiCalls: this.apiCallCount,
      error
    };
  }

  /**
   * Log message if logging is enabled
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[TaxonomyNavigator] ${message}`);
    }
  }

  // ============================================
  // ROBUST VERSION ADDITIONS
  // ============================================
  
  /**
   * For robust version: Add rate limiting
   * Uncomment and implement for production use
   */
  // private rateLimitState = {
  //   requestsThisMinute: 0,
  //   requestsToday: 0,
  //   minuteResetTime: Date.now() + 60000,
  //   dayResetTime: Date.now() + 86400000
  // };

  // private async checkRateLimit(): Promise<void> {
  //   const now = Date.now();
  //   
  //   // Reset counters if needed
  //   if (now > this.rateLimitState.minuteResetTime) {
  //     this.rateLimitState.requestsThisMinute = 0;
  //     this.rateLimitState.minuteResetTime = now + 60000;
  //   }
  //   
  //   if (now > this.rateLimitState.dayResetTime) {
  //     this.rateLimitState.requestsToday = 0;
  //     this.rateLimitState.dayResetTime = now + 86400000;
  //   }
  //   
  //   // Check limits
  //   if (this.rateLimitState.requestsThisMinute >= this.config.rateLimit.maxRequestsPerMinute!) {
  //     const waitTime = this.rateLimitState.minuteResetTime - now;
  //     await new Promise(resolve => setTimeout(resolve, waitTime));
  //   }
  //   
  //   if (this.rateLimitState.requestsToday >= this.config.rateLimit.maxRequestsPerDay!) {
  //     throw new Error('Daily API limit reached');
  //   }
  //   
  //   // Increment counters
  //   this.rateLimitState.requestsThisMinute++;
  //   this.rateLimitState.requestsToday++;
  // }

  /**
   * For robust version: Add retry logic
   */
  // private async retryableCall<T>(
  //   operation: () => Promise<T>, 
  //   retries = this.config.maxRetries
  // ): Promise<T> {
  //   try {
  //     return await operation();
  //   } catch (error) {
  //     if (retries > 0) {
  //       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  //       return this.retryableCall(operation, retries - 1);
  //     }
  //     throw error;
  //   }
  // }
} 