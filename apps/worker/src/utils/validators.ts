import { createHash } from 'crypto';
import { MissingPerson } from '@overwatch/shared';

/**
 * Generate deterministic hash for deduplication
 * Hash based on key identifying fields to prevent duplicates
 */
export function generateDataHash(person: Partial<MissingPerson>): string {
  const identifierString = `${person.name}-${person.lastSeenDate}-${person.sourceURL}`;
  return createHash('sha256').update(identifierString).digest('hex');
}

/**
 * Normalize text data from HTML (trim, remove extra spaces)
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Parse Indian date formats
 * Supports: DD-MM-YYYY, DD/MM/YYYY, DD MMM YYYY
 */
export function parseIndianDate(dateString: string): Date | null {
  const normalized = normalizeText(dateString);

  // DD-MM-YYYY or DD/MM/YYYY
  let match = normalized.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // DD MMM YYYY (e.g., "05 Jan 2024")
  match = normalized.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const [, day, monthStr, year] = match;
    const date = new Date(`${monthStr} ${day}, ${year}`);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try native parsing as fallback
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate age is within reasonable bounds
 */
export function validateAge(age: number | string): number | null {
  const ageNum = typeof age === 'string' ? parseInt(age, 10) : age;
  return isNaN(ageNum) || ageNum < 0 || ageNum > 150 ? null : ageNum;
}

/**
 * Validate coordinates are within India bounds
 */
export function isValidIndianCoordinates(latitude: number, longitude: number): boolean {
  return latitude >= 8.0 && latitude <= 35.5 && longitude >= 68.0 && longitude <= 97.5;
}

/**
 * Standard Indian state list
 */
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

/**
 * Clean and validate extracted data
 */
export function validateExtractedData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be an object');
    return { valid: false, errors };
  }

  const person = data as Record<string, unknown>;

  // Required fields
  if (!person.name || typeof person.name !== 'string') {
    errors.push('Name is required and must be a string');
  }

  if (typeof person.age !== 'number' || person.age < 0 || person.age > 150) {
    errors.push('Age must be a number between 0 and 150');
  }

  if (!['male', 'female', 'other'].includes(person.gender as string)) {
    errors.push('Gender must be male, female, or other');
  }

  if (!(person.lastSeenDate instanceof Date)) {
    errors.push('Last seen date must be a valid date');
  }

  if (!person.lastKnownLocation || typeof person.lastKnownLocation !== 'string') {
    errors.push('Last known location is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
