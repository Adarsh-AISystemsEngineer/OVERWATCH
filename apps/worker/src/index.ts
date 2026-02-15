import mongoose from 'mongoose';
import { MaharashtraScraper, KarnatakaScraper } from './scrapers/stateSrapers';
import { DelhiZIPNETScraper } from './scrapers/delhiZIPNET';
import { DataTransformer } from './transformer/transformer';
import { DatabaseService } from './services/databaseService';
import { ErrorLogger } from './utils/errorLogger';
import { SUPPORTED_STATES } from '@overwatch/shared';

/**
 * Main worker orchestration
 * Coordinates scraping, transformation, and database insertion
 */
class OverwatchWorker {
  private mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/overwatch';

  /**
   * Initialize worker (connect to database)
   */
  async initialize(): Promise<void> {
    try {
      await mongoose.connect(this.mongoUri);
      console.log('✓ Connected to MongoDB');
    } catch (error) {
      console.error('✗ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Run full ETL pipeline
   */
  async runETLPipeline(): Promise<void> {
    console.log('[Worker] Starting ETL pipeline...');
    console.log(`[Worker] Processing states: ${SUPPORTED_STATES.join(', ')}`);

    const results = {
      Maharashtra: { scraped: 0, valid: 0, invalid: 0, inserted: 0, duplicates: 0, error: null as string | null },
      Karnataka: { scraped: 0, valid: 0, invalid: 0, inserted: 0, duplicates: 0, error: null as string | null },
      Delhi: { scraped: 0, valid: 0, invalid: 0, inserted: 0, duplicates: 0, error: null as string | null },
    };

    // Maharashtra Scraper
    try {
      console.log('\n[Worker] === Maharashtra Pipeline===');
      const maharashtraRecords = await MaharashtraScraper.scrape();
      results.Maharashtra.scraped = maharashtraRecords.length;

      const { valid, invalid } = await DataTransformer.transform(maharashtraRecords);
      results.Maharashtra.valid = valid.length;
      results.Maharashtra.invalid = invalid.length;

      if (invalid.length > 0) {
        ErrorLogger.logValidationErrors('Maharashtra', invalid);
      }

      const dbResult = await DatabaseService.insertRecords(valid, 'Maharashtra');
      results.Maharashtra.inserted = dbResult.inserted;
      results.Maharashtra.duplicates = dbResult.duplicates;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.Maharashtra.error = errorMsg;
      ErrorLogger.logError('Maharashtra', error as Error);
    }

    // Karnataka Scraper
    try {
      console.log('\n[Worker] === Karnataka Pipeline ===');
      const karnatakaRecords = await KarnatakaScraper.scrape();
      results.Karnataka.scraped = karnatakaRecords.length;

      const { valid, invalid } = await DataTransformer.transform(karnatakaRecords);
      results.Karnataka.valid = valid.length;
      results.Karnataka.invalid = invalid.length;

      if (invalid.length > 0) {
        ErrorLogger.logValidationErrors('Karnataka', invalid);
      }

      const dbResult = await DatabaseService.insertRecords(valid, 'Karnataka');
      results.Karnataka.inserted = dbResult.inserted;
      results.Karnataka.duplicates = dbResult.duplicates;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.Karnataka.error = errorMsg;
      ErrorLogger.logError('Karnataka', error as Error);
    }

    // Delhi ZIPNET Scraper
    try {
      console.log('\n[Worker] === Delhi ZIPNET Pipeline ===');
      const delhiRecords = await DelhiZIPNETScraper.scrape();
      results.Delhi.scraped = delhiRecords.length;

      const { valid, invalid } = await DataTransformer.transform(delhiRecords);
      results.Delhi.valid = valid.length;
      results.Delhi.invalid = invalid.length;

      if (invalid.length > 0) {
        ErrorLogger.logValidationErrors('Delhi', invalid);
      }

      const dbResult = await DatabaseService.insertRecords(valid, 'Delhi');
      results.Delhi.inserted = dbResult.inserted;
      results.Delhi.duplicates = dbResult.duplicates;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      results.Delhi.error = errorMsg;
      ErrorLogger.logError('Delhi', error as Error);
    }

    // Get final statistics
    const stats = await DatabaseService.getStatistics();

    console.log('\n[Worker] === Pipeline Complete ===');
    console.log(JSON.stringify(results, null, 2));
    console.log('\n[Worker] === Database Statistics ===');
    console.log(JSON.stringify(stats, null, 2));
  }

  /**
   * Shutdown worker (close database connection)
   */
  async shutdown(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✓ Disconnected from MongoDB');
    } catch (error) {
      console.error('✗ Error during shutdown:', error);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const worker = new OverwatchWorker();

  try {
    await worker.initialize();
    await worker.runETLPipeline();
  } catch (error) {
    console.error('✗ Worker failed:', error);
    process.exit(1);
  } finally {
    await worker.shutdown();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { OverwatchWorker };
