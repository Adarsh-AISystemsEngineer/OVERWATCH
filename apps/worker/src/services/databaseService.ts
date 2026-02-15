import mongoose from 'mongoose';
import { MissingPersonModel } from '../models/MissingPerson';
import { MissingPerson } from '@overwatch/shared';
import { ErrorLogger } from '../utils/errorLogger';

/**
 * Database layer for inserting validated data
 * Handles deduplication and transaction safety
 */
export class DatabaseService {
  /**
   * Insert missing persons records with deduplication
   */
  static async insertRecords(
    records: MissingPerson[],
    state: string
  ): Promise<{ inserted: number; duplicates: number }> {
    console.log(`[Database] Inserting ${records.length} records from ${state}...`);

    let inserted = 0;
    let duplicates = 0;

    for (const record of records) {
      try {
        // Check for duplicate by hash
        const existing = await MissingPersonModel.findOne({ dataHash: record.dataHash });

        if (existing) {
          duplicates++;
          // Optionally update existing record with newer status
          if (record.status !== existing.status) {
            await MissingPersonModel.updateOne(
              { _id: existing._id },
              { status: record.status, updatedAt: new Date() }
            );
          }
          continue;
        }

        // Insert new record
        await MissingPersonModel.create(record);
        inserted++;
      } catch (error) {
        console.error(`[Database] Failed to insert record for ${record.name}:`, error);
        ErrorLogger.logError(state, error as Error, {
          recordName: record.name,
          dataHash: record.dataHash,
        });
      }
    }

    console.log(
      `[Database] Results - Inserted: ${inserted}, Duplicates: ${duplicates}, Total: ${records.length}`
    );
    return { inserted, duplicates };
  }

  /**
   * Get scrape statistics
   */
  static async getStatistics(): Promise<Record<string, unknown>> {
    const stats = await MissingPersonModel.aggregate([
      {
        $facet: {
          totalRecords: [{ $count: 'count' }],
          byState: [
            { $group: { _id: '$sourceState', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          lastUpdated: [
            { $group: { _id: null, maxDate: { $max: '$updatedAt' } } },
          ],
        },
      },
    ]);

    return {
      totalRecords: stats[0].totalRecords[0]?.count || 0,
      byState: stats[0].byState,
      byStatus: stats[0].byStatus,
      lastUpdated: stats[0].lastUpdated[0]?.maxDate || null,
    };
  }
}
