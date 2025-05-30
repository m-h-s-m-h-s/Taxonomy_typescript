/**
 * Type definitions for the Taxonomy Navigator system
 */

export interface TaxonomyNode {
  name: string;
  children: Record<string, TaxonomyNode>;
  isLeaf: boolean;
}

export interface TaxonomyPath {
  fullPath: string;
  parts: string[];
  isLeaf: boolean;
}

export interface ClassificationResult {
  success: boolean;
  paths: string[][];
  bestMatchIndex: number;
  bestMatch: string;
  leafCategory: string;
  processingTime: number;
  apiCalls: number;
  error?: string;
}

export interface StageResult {
  stage: string;
  selections: string[];
  apiCallCount: number;
}

export interface TaxonomyNavigatorConfig {
  taxonomyFile?: string;
  apiKey?: string;
  model?: string;
  stage2Model?: string;
  stage3Model?: string;
  maxRetries?: number;
  enableLogging?: boolean;
  // Rate limiting config (for robust version)
  rateLimit?: {
    maxRequestsPerMinute?: number;
    maxRequestsPerDay?: number;
  };
}

export interface BatchProcessingOptions {
  batchSize: number;
  maxSelectionsPerBatch: number;
} 