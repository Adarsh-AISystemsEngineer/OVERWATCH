import { load } from 'cheerio';
import { MissingPerson, Gender, MissingPersonStatus } from '@overwatch/shared';
import { HttpClient } from '../utils/httpClient';
import { generateDataHash, parseIndianDate, normalizeText } from '../utils/validators';

/**
 * Scraper for Maharashtra Police Missing Persons Database
 * Website: https://avm.maharashtra.gov.in/PublicUtility/MissingPerson.aspx
 */
export class MaharashtraScraper {
  private static readonly SOURCE_STATE = 'Maharashtra';
  private static readonly SOURCE_URL = 'https://avm.maharashtra.gov.in/PublicUtility/MissingPerson.aspx';

  /**
   * Scrape Maharashtra missing persons data
   * This is a placeholder - real implementation depends on actual HTML structure
   */
  static async scrape(): Promise<Partial<MissingPerson>[]> {
    console.log('[Maharashtra Scraper] Starting scrape...');

    try {
      const html = await HttpClient.fetch(this.SOURCE_URL);
      const $ = load(html);

      const records: Partial<MissingPerson>[] = [];

      // Example: Select rows from a table (actual selector depends on HTML structure)
      $('table tbody tr').each((_, element) => {
        try {
          const row = $(element);

          const name = normalizeText(row.find('td:nth-child(1)').text());
          const ageStr = row.find('td:nth-child(2)').text();
          const genderStr = normalizeText(row.find('td:nth-child(3)').text()).toLowerCase();
          const lastSeenStr = row.find('td:nth-child(4)').text();
          const location = normalizeText(row.find('td:nth-child(5)').text());
          const statusStr = normalizeText(row.find('td:nth-child(6)').text()).toLowerCase();

          // Validate required fields
          if (!name || !location) {
            console.warn('[Maharashtra Scraper] Skipping record with missing name or location');
            return;
          }

          const age = parseInt(ageStr, 10);
          if (isNaN(age) || age < 0 || age > 150) {
            console.warn(`[Maharashtra Scraper] Invalid age: ${ageStr}`);
            return;
          }

          const lastSeenDate = parseIndianDate(lastSeenStr);
          if (!lastSeenDate) {
            console.warn(`[Maharashtra Scraper] Invalid date: ${lastSeenStr}`);
            return;
          }

          // Determine gender
          let gender: Gender;
          if (genderStr.includes('male')) gender = Gender.MALE;
          else if (genderStr.includes('female')) gender = Gender.FEMALE;
          else gender = Gender.OTHER;

          // Determine status
          const status = statusStr.includes('found') ? MissingPersonStatus.FOUND : MissingPersonStatus.MISSING;

          const record: Partial<MissingPerson> = {
            name,
            age,
            gender,
            lastSeenDate,
            lastKnownLocation: location,
            status,
            sourceState: this.SOURCE_STATE,
            sourceURL: this.SOURCE_URL,
            // Coordinates would be set by geocoding service or cached data
            geolocation: {
              type: 'Point',
              coordinates: [75.7139, 19.7515], // Default to Maharashtra center
            },
            dataHash: generateDataHash({
              name,
              lastSeenDate,
              sourceURL: this.SOURCE_URL,
            }),
          };

          records.push(record);
        } catch (error) {
          console.error('[Maharashtra Scraper] Error processing row:', error);
        }
      });

      console.log(`[Maharashtra Scraper] Scraped ${records.length} records`);
      return records;
    } catch (error) {
      console.error('[Maharashtra Scraper] Error:', error);
      throw error;
    }
  }
}

/**
 * Scraper for Karnataka Police Missing Persons Database
 * Website: https://www.sugamkbc.gov.in
 */
export class KarnatakaScraper {
  private static readonly SOURCE_STATE = 'Karnataka';
  private static readonly SOURCE_URL = 'https://www.sugamkbc.gov.in';

  static async scrape(): Promise<Partial<MissingPerson>[]> {
    console.log('[Karnataka Scraper] Starting scrape...');

    try {
      const html = await HttpClient.fetch(this.SOURCE_URL);
      const $ = load(html);

      const records: Partial<MissingPerson>[] = [];

      // Example: Parse missing persons from search results
      $('[data-missing-person]').each((_, element) => {
        try {
          const $elem = $(element);

          const name = normalizeText($elem.find('[data-name]').text());
          const age = parseInt($elem.find('[data-age]').text(), 10);
          const genderStr = normalizeText($elem.find('[data-gender]').text()).toLowerCase();
          const lastSeenStr = $elem.find('[data-last-seen]').text();
          const location = normalizeText($elem.find('[data-location]').text());

          if (!name || !location || isNaN(age)) return;

          const lastSeenDate = parseIndianDate(lastSeenStr);
          if (!lastSeenDate) return;

          let gender: Gender;
          if (genderStr.includes('male')) gender = Gender.MALE;
          else if (genderStr.includes('female')) gender = Gender.FEMALE;
          else gender = Gender.OTHER;

          const record: Partial<MissingPerson> = {
            name,
            age,
            gender,
            lastSeenDate,
            lastKnownLocation: location,
            status: MissingPersonStatus.MISSING,
            sourceState: this.SOURCE_STATE,
            sourceURL: this.SOURCE_URL,
            geolocation: {
              type: 'Point',
              coordinates: [75.7139, 15.3173], // Default to Karnataka center
            },
            dataHash: generateDataHash({
              name,
              lastSeenDate,
              sourceURL: this.SOURCE_URL,
            }),
          };

          records.push(record);
        } catch (error) {
          console.error('[Karnataka Scraper] Error processing element:', error);
        }
      });

      console.log(`[Karnataka Scraper] Scraped ${records.length} records`);
      return records;
    } catch (error) {
      console.error('[Karnataka Scraper] Error:', error);
      throw error;
    }
  }
}
