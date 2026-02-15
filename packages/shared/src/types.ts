import { z } from 'zod';

/**
 * Enum for missing person status
 * missing: Person currently missing
 * found: Person has been located/found
 */
export enum MissingPersonStatus {
  MISSING = 'missing',
  FOUND = 'found',
}

/**
 * Enum for gender classification
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

/**
 * Zod schema for geographic coordinates
 * Follows GeoJSON 2dsphere format: [longitude, latitude]
 */
export const GeoLocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lon, lat]
});

/**
 * Zod schema for missing person with validation
 */
export const MissingPersonSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  age: z.number().int().min(0).max(150),
  gender: z.nativeEnum(Gender),
  lastSeenDate: z.date(),
  lastKnownLocation: z.string().min(1, 'Location is required'),
  geolocation: GeoLocationSchema,
  status: z.nativeEnum(MissingPersonStatus),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
  contactName: z.string().max(255).optional(),
  contactPhone: z.string().regex(/^[0-9+\-\s()]+$/).optional(),
  sourceURL: z.string().url('Source URL must be valid'),
  sourceState: z.string().min(2).max(50), // e.g., "Maharashtra", "Karnataka"
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  dataHash: z.string().optional(), // For deduplication
});

export type MissingPerson = z.infer<typeof MissingPersonSchema>;

/**
 * API Request/Response types
 */
export const FilterParamsSchema = z.object({
  gender: z.nativeEnum(Gender).optional(),
  ageMin: z.number().int().min(0).optional(),
  ageMax: z.number().int().max(150).optional(),
  status: z.nativeEnum(MissingPersonStatus).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  state: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type FilterParams = z.infer<typeof FilterParamsSchema>;

export const GeoQuerySchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  radiusKm: z.number().min(0.1).max(500).default(50),
  limit: z.number().int().min(1).max(100).default(20),
});

export type GeoQuery = z.infer<typeof GeoQuerySchema>;

/**
 * API Response envelope
 */
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  error: z.string().optional(),
  timestamp: z.date(),
});

export type ApiResponse<T = unknown> = z.infer<typeof ApiResponseSchema> & {
  data: T;
};

/**
 * Hotspot analytics
 */
export const HotspotSchema = z.object({
  state: z.string(),
  region: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  missingCount: z.number().int().min(0),
  foundCount: z.number().int().min(0),
  averageAge: z.number(),
  timeRange: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }),
});

export type Hotspot = z.infer<typeof HotspotSchema>;
