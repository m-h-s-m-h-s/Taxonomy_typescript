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

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { TaxonomyNavigator, ClassificationResult } from './index';
import { getApiKey } from './config';

// Configure logging level
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3,
  CRITICAL = 4
}

let currentLogLevel = LogLevel.INFO;

const logger = {
  debug: (msg: string) => currentLogLevel <= LogLevel.DEBUG && console.log(`[${new Date().toISOString()}] - taxonomy_interface - DEBUG - ${msg}`),
  info: (msg: string) => currentLogLevel <= LogLevel.INFO && console.log(`[${new Date().toISOString()}] - taxonomy_interface - INFO - ${msg}`),
  warning: (msg: string) => currentLogLevel <= LogLevel.WARNING && console.warn(`[${new Date().toISOString()}] - taxonomy_interface - WARNING - ${msg}`),
  error: (msg: string) => currentLogLevel <= LogLevel.ERROR && console.error(`[${new Date().toISOString()}] - taxonomy_interface - ERROR - ${msg}`),
  critical: (msg: string) => console.error(`[${new Date().toISOString()}] - taxonomy_interface - CRITICAL - ${msg}`)
};

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

export class TaxonomyInterface {
  private navigator: TaxonomyNavigator;
  private saveResults: boolean;
  private outputFile: string;
  private sessionResults: SessionResult[] = [];
  private rl: readline.Interface;

  constructor(
    taxonomyFile?: string,
    apiKey?: string,
    model: string = 'gpt-4.1-nano',
    saveResults: boolean = false,
    outputFile?: string
  ) {
    logger.info('Initializing Taxonomy Navigator Interactive Interface');

    // Set default taxonomy file path if not provided
    if (!taxonomyFile) {
      taxonomyFile = path.join(__dirname, '..', '..', 'data', 'taxonomy.en-US.txt');
    }

    // Initialize the navigator
    this.navigator = new TaxonomyNavigator({
      taxonomyFile,
      apiKey,
      model
    });

    // Configure result saving
    this.saveResults = saveResults;
    this.outputFile = outputFile || `interactive_results_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Initialize readline interface
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    logger.info('Interface initialized successfully');
  }

  displayWelcome(): void {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TAXONOMY NAVIGATOR - INTERACTIVE INTERFACE');
    console.log('='.repeat(70));
    console.log('\nWelcome to the AI-powered product classification system!');
    console.log('\nThis interface uses a sophisticated 5-stage AI process to classify');
    console.log('products into appropriate taxonomy categories using OpenAI\'s models.');
    console.log('\n📋 How to use:');
    console.log('  • Enter product information when prompted');
    console.log('  • Use format: \'Product Name: Description\' or just \'Product Name\'');
    console.log('  • Type \'quit\', \'exit\', or \'q\' to end the session');
    console.log('  • Type \'help\' for additional commands');
    console.log('  • Type \'stats\' to see session statistics');
    console.log('\n💡 Examples:');
    console.log('  • iPhone 14 Pro: Smartphone with advanced camera system');
    console.log('  • Xbox Wireless Controller: Gaming controller with Bluetooth');
    console.log('  • Nike Air Max: Running shoes with air cushioning');
    console.log('\n🤖 5-Stage Classification Process:');
    console.log('  1. AI generates focused 40-60 word product summary');
    console.log('  2. AI selects top 2 L1 categories from ~21 options');
    console.log('  3. AI selects specific categories using batch processing');
    console.log('  4. Validation ensures no hallucinated categories');
    console.log('  5. AI final selection using enhanced model');
    console.log('\n' + '='.repeat(70) + '\n');
  }

  displayHelp(): void {
    console.log('\n📖 HELP - Available Commands:');
    console.log('-'.repeat(40));
    console.log('🔍 Classification Commands:');
    console.log('  • Enter any product info to classify it');
    console.log('  • Format: \'Product Name: Description\'');
    console.log('  • Or just: \'Product Name\'');
    console.log('\n⚙️  System Commands:');
    console.log('  • help, h          - Show this help message');
    console.log('  • stats, statistics - Show session statistics');
    console.log('  • clear, cls       - Clear the screen');
    console.log('  • quit, exit, q    - Exit the interface');
    console.log('\n💾 Results:');
    if (this.saveResults) {
      console.log(`  • Results are being saved to: ${this.outputFile}`);
    } else {
      console.log('  • Results are not being saved (use --save-results to enable)');
    }
    console.log('-'.repeat(40) + '\n');
  }

  displayStats(): void {
    const totalClassifications = this.sessionResults.length;
    const successfulClassifications = this.sessionResults.filter(r => r.bestMatch !== 'False').length;
    const failedClassifications = totalClassifications - successfulClassifications;

    console.log('\n📊 SESSION STATISTICS:');
    console.log('-'.repeat(30));
    console.log(`Total Classifications: ${totalClassifications}`);
    console.log(`Successful: ${successfulClassifications}`);
    console.log(`Failed: ${failedClassifications}`);

    if (totalClassifications > 0) {
      const successRate = (successfulClassifications / totalClassifications) * 100;
      console.log(`Success Rate: ${successRate.toFixed(1)}%`);

      // Show recent classifications
      console.log('\n🕒 Recent Classifications:');
      const recent = this.sessionResults.slice(-5); // Last 5
      recent.forEach((result, i) => {
        const product = result.productInfo.length > 40 
          ? result.productInfo.substring(0, 40) + '...' 
          : result.productInfo;
        const match = result.bestMatch;
        console.log(`  ${i + 1}. ${product} → ${match}`);
      });
    }

    console.log('-'.repeat(30) + '\n');
  }

  clearScreen(): void {
    console.clear();
  }

  async classifyProduct(productInfo: string): Promise<SessionResult> {
    console.log(`\n🔍 Classifying: ${productInfo}`);
    console.log('⏳ Processing... (this may take a few seconds)');

    try {
      // Perform classification
      const startTime = new Date();
      const result = await this.navigator.classifyProduct(productInfo);
      const endTime = new Date();

      // Create result record
      const sessionResult: SessionResult = {
        timestamp: startTime.toISOString(),
        productInfo,
        bestMatch: result.success ? result.bestMatch : 'False',
        bestPath: result.success ? result.paths[result.bestMatchIndex] : [],
        allCandidates: result.success ? result.paths.map(p => p.join(' > ')) : [],
        processingTimeSeconds: (endTime.getTime() - startTime.getTime()) / 1000,
        success: result.success,
        error: result.error
      };

      // Display result in clean format
      console.log(`\n[${productInfo}]`);
      if (result.success) {
        console.log(result.leafCategory);
      } else {
        console.log('False');
      }
      console.log('-'.repeat(50));

      // Save to session results
      this.sessionResults.push(sessionResult);

      // Save to file if enabled
      if (this.saveResults) {
        this.saveResultToFile(sessionResult);
      }

      return sessionResult;

    } catch (error) {
      const errorMsg = `Error during classification: ${error}`;
      logger.error(errorMsg);
      console.log(`\n❌ ${errorMsg}`);

      // Create error result
      const errorResult: SessionResult = {
        timestamp: new Date().toISOString(),
        productInfo,
        bestMatch: 'Error',
        bestPath: [],
        allCandidates: [],
        processingTimeSeconds: 0,
        success: false,
        error: String(error)
      };
      this.sessionResults.push(errorResult);
      return errorResult;
    }
  }

  private saveResultToFile(result: SessionResult): void {
    try {
      // Read existing data or create new array
      let data: SessionResult[] = [];
      if (fs.existsSync(this.outputFile)) {
        const content = fs.readFileSync(this.outputFile, 'utf-8');
        data = JSON.parse(content);
      }

      // Add new result
      data.push(result);

      // Write back to file
      fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug(`Result saved to ${this.outputFile}`);

    } catch (error) {
      logger.error(`Failed to save result to file: ${error}`);
    }
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  async run(): Promise<void> {
    this.displayWelcome();

    try {
      while (true) {
        // Get user input
        const userInput = await this.prompt('🔍 Enter product info (or \'help\' for commands): ');
        const input = userInput.trim();

        // Handle empty input
        if (!input) {
          console.log('⚠️  Please enter some product information or type \'help\' for commands.');
          continue;
        }

        // Process commands
        const command = input.toLowerCase();

        if (['quit', 'exit', 'q'].includes(command)) {
          console.log('\n👋 Thank you for using Taxonomy Navigator!');
          if (this.sessionResults.length > 0) {
            console.log(`📊 Session Summary: ${this.sessionResults.length} classifications completed`);
            if (this.saveResults) {
              console.log(`💾 Results saved to: ${this.outputFile}`);
            }
          }
          break;
        } else if (['help', 'h'].includes(command)) {
          this.displayHelp();
          continue;
        } else if (['stats', 'statistics'].includes(command)) {
          this.displayStats();
          continue;
        } else if (['clear', 'cls'].includes(command)) {
          this.clearScreen();
          this.displayWelcome();
          continue;
        }

        // Classify the product
        await this.classifyProduct(input);
      }
    } catch (error) {
      logger.error(`Unexpected error in interface: ${error}`);
      console.log(`\n❌ An unexpected error occurred: ${error}`);
      console.log('Please restart the interface.');
    } finally {
      this.rl.close();
    }
  }
}

// Command-line interface
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Simple argument parsing
  const getArg = (flag: string, defaultValue?: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
      return args[index + 1];
    }
    return defaultValue;
  };

  const hasFlag = (flag: string): boolean => args.includes(flag);

  // Parse arguments
  const defaultTaxonomy = path.join(__dirname, '..', '..', 'data', 'taxonomy.en-US.txt');
  const taxonomyFile = getArg('--taxonomy-file', defaultTaxonomy);
  const apiKey = getArg('--api-key');
  const model = getArg('--model', 'gpt-4.1-nano');
  const saveResults = hasFlag('--save-results');
  const outputFile = getArg('--output-file');
  const verbose = hasFlag('--verbose');

  // Configure logging level
  if (verbose) {
    currentLogLevel = LogLevel.DEBUG;
  } else {
    currentLogLevel = LogLevel.CRITICAL;
  }

  try {
    // Validate API key availability
    const resolvedApiKey = getApiKey(apiKey);
    if (!resolvedApiKey) {
      console.error('❌ Error: OpenAI API key not found.');
      console.log('\n💡 Please provide your API key using one of these methods:');
      console.log('   1. Set environment variable: export OPENAI_API_KEY=your-key');
      console.log('   2. Create file: data/api_key.txt with your key');
      console.log('   3. Use command line: --api-key your-key');
      process.exit(1);
    }

    // Initialize and run the interface
    const interface_ = new TaxonomyInterface(
      taxonomyFile,
      resolvedApiKey,
      model,
      saveResults,
      outputFile
    );

    await interface_.run();

  } catch (error) {
    logger.error(`Failed to start interface: ${error}`);
    console.error(`❌ Error starting interface: ${error}`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
} 