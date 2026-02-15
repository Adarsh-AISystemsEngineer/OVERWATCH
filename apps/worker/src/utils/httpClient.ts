import axios, { AxiosError } from 'axios';
import { SCRAPER_CONFIG } from '@overwatch/shared';

/**
 * Error types for scraper
 */
export class ScraperError extends Error {
  constructor(
    public code: string,
    message: string,
    public sourceUrl: string
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

/**
 * HTTP client for scraping with retries and error handling
 */
export class HttpClient {
  /**
   * Fetch HTML content with retry mechanism
   */
  static async fetch(url: string): Promise<string> {
    let lastError: AxiosError | null = null;

    for (let attempt = 0; attempt < SCRAPER_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await axios.get(url, {
          timeout: SCRAPER_CONFIG.TIMEOUT_MS,
          headers: {
            'User-Agent': SCRAPER_CONFIG.USER_AGENT,
            'Accept-Language': 'en-IN,en;q=0.9',
          },
        });

        if (response.status === 200) {
          return response.data;
        }

        throw new ScraperError(
          'HTTP_ERROR',
          `HTTP ${response.status}: ${response.statusText}`,
          url
        );
      } catch (error) {
        lastError = error as AxiosError;

        if (attempt < SCRAPER_CONFIG.RETRY_ATTEMPTS - 1) {
          const delay = SCRAPER_CONFIG.RETRY_DELAY_MS * (attempt + 1);
          console.log(
            `[Scraper] Retry attempt ${attempt + 1}/${SCRAPER_CONFIG.RETRY_ATTEMPTS} for ${url} after ${delay}ms`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new ScraperError(
      'FETCH_FAILED',
      `Failed to fetch after ${SCRAPER_CONFIG.RETRY_ATTEMPTS} attempts: ${lastError?.message}`,
      url
    );
  }
}
