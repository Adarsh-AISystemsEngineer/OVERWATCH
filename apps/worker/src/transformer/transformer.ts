import { MissingPerson } from '@overwatch/shared';
import { validateExtractedData } from '../utils/validators';

/**
 * Data transformation layer
 * Converts raw scraped data into validated MissingPerson objects
 */
export class DataTransformer {
  /**
   * Transform scraped records into valid MissingPerson objects
   */
  static async transform(rawRecords: Partial<MissingPerson>[]): Promise<{
    valid: MissingPerson[];
    invalid: Array<{ data: Partial<MissingPerson>; errors: string[] }>;
  }> {
    console.log(`[Transformer] Transforming ${rawRecords.length} records...`);

    const valid: MissingPerson[] = [];
    const invalid: Array<{ data: Partial<MissingPerson>; errors: string[] }> = [];

    for (const record of rawRecords) {
      const validation = validateExtractedData(record);

      if (validation.valid) {
        valid.push(record as MissingPerson);
      } else {
        invalid.push({
          data: record,
          errors: validation.errors,
        });
      }
    }

    console.log(`[Transformer] Valid: ${valid.length}, Invalid: ${invalid.length}`);

    return { valid, invalid };
  }
}
