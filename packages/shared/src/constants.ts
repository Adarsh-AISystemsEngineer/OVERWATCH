/**
 * Constants for the application
 */

// Geographic bounds for India (approximate)
export const INDIA_BOUNDS = {
  NORTH: 35.5,
  SOUTH: 8.0,
  EAST: 97.5,
  WEST: 68.0,
};

// Supported states for V1 (can be extended)
export const SUPPORTED_STATES = ['Maharashtra', 'Karnataka', 'Delhi'];

// Data source configurations
export const DATA_SOURCES = {
  MAHARASHTRA: {
    url: 'https://avm.maharashtra.gov.in/PublicUtility/MissingPerson.aspx',
    state: 'Maharashtra',
  },
  KARNATAKA: {
    url: 'https://www.sugamkbc.gov.in',
    state: 'Karnataka',
  },
  DELHI: {
    url: 'https://zipnet.delhipolice.gov.in/victims/missingpersons/',
    state: 'Delhi',
    coverage: 'Delhi, NCR (Haryana, Rajasthan, Uttrakhand, Punjab)',
  },
};

// API rate limiting
export const RATE_LIMIT = {
  REQUESTS_PER_MINUTE: 60,
  REQUESTS_PER_HOUR: 1000,
};

// Cache durations (in seconds)
export const CACHE_DURATIONS = {
  HOTSPOT_DATA: 3600, // 1 hour
  AGGREGATE_STATS: 1800, // 30 minutes
  MISSING_PERSONS_LIST: 300, // 5 minutes
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
};

// Scraper configuration
export const SCRAPER_CONFIG = {
  TIMEOUT_MS: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
  USER_AGENT: 'OverwatchBot/1.0 (Missing Persons Data Collection)',
};

// LLM service configuration
export const LLM_CONFIG = {
  MODEL: 'Qwen2.5-7B-Instruct',
  TIMEOUT_MS: 60000,
  MAX_TOKENS: 2048,
  TEMPERATURE: 0.1, // Low temperature for consistent extraction
};

// Data validation
export const VALIDATION = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_AGE: 0,
  MAX_AGE: 150,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
};

// Hotspot configuration
export const HOTSPOT = {
  MIN_CLUSTER_SIZE: 3, // Minimum missing persons to create hotspot
  RADIUS_KM: 25, // Clustering radius
  TIME_WINDOW_DAYS: 90, // Consider data within last 90 days
};
