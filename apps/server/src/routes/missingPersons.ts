import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  FilterParamsSchema,
  GeoQuerySchema,
  ApiResponse,
  Gender,
  MissingPersonStatus,
} from '@overwatch/shared';
import { MissingPersonModel } from '../models/MissingPerson';
import { cacheMiddleware } from '../middleware/cache';
import { errorHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Helper function to validate request query/body against Zod schema
 */
async function validateAndParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  return schema.parseAsync(data) as Promise<T>;
}

/**
 * GET /api/missing-persons
 * Retrieve missing persons with filters
 *
 * Query params:
 * - gender: Gender (male, female, other) - optional
 * - ageMin: number - optional
 * - ageMax: number - optional
 * - status: MissingPersonStatus (missing, found) - optional
 * - startDate: ISO string - optional
 * - endDate: ISO string - optional
 * - state: string - optional
 * - limit: number (1-100) - default 20
 * - offset: number - default 0
 */
router.get('/', cacheMiddleware(300), async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate query parameters
    const params = await validateAndParse(FilterParamsSchema, {
      gender: req.query.gender as string | undefined,
      ageMin: req.query.ageMin ? parseInt(req.query.ageMin as string) : undefined,
      ageMax: req.query.ageMax ? parseInt(req.query.ageMax as string) : undefined,
      status: req.query.status as string | undefined,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      state: req.query.state as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    // Build MongoDB query filter
    const filter: Record<string, unknown> = {};

    if (params.gender) {
      filter.gender = params.gender;
    }

    if (params.ageMin !== undefined || params.ageMax !== undefined) {
      filter.age = {};
      if (params.ageMin !== undefined) (filter.age as Record<string, number>).$gte = params.ageMin;
      if (params.ageMax !== undefined) (filter.age as Record<string, number>).$lte = params.ageMax;
    }

    if (params.status) {
      filter.status = params.status;
    }

    if (params.startDate || params.endDate) {
      filter.lastSeenDate = {};
      if (params.startDate)
        (filter.lastSeenDate as Record<string, Date>).$gte = params.startDate;
      if (params.endDate) (filter.lastSeenDate as Record<string, Date>).$lte = params.endDate;
    }

    if (params.state) {
      filter.sourceState = params.state;
    }

    // Execute query with pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    
    const [data, total] = await Promise.all([
      MissingPersonModel.find(filter)
        .sort({ lastSeenDate: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      MissingPersonModel.countDocuments(filter),
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        results: data,
        pagination: {
          limit,
          offset,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/missing-persons/nearby
 * Find missing persons near a geographic location
 *
 * Query params:
 * - longitude: number (-180 to 180)
 * - latitude: number (-90 to 90)
 * - radiusKm: number (0.1 to 500) - default 50
 * - limit: number (1-100) - default 20
 */
router.get('/nearby', cacheMiddleware(300), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = await validateAndParse(GeoQuerySchema, {
      longitude: parseFloat(req.query.longitude as string),
      latitude: parseFloat(req.query.latitude as string),
      radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 50,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    });

    const radiusKm = query.radiusKm || 50;
    const limitValue = query.limit || 20;

    // MongoDB geospatial query using 2dsphere index
    const data = await MissingPersonModel.find({
      geolocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [query.longitude, query.latitude],
          },
          $maxDistance: radiusKm * 1000, // Convert km to meters
        },
      },
    })
      .limit(limitValue)
      .lean();

    const response: ApiResponse = {
      success: true,
      data: {
        centerPoint: {
          longitude: query.longitude,
          latitude: query.latitude,
        },
        radiusKm,
        results: data,
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/missing-persons/:id
 * Get single missing person by ID
 */
router.get('/:id', cacheMiddleware(600), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await MissingPersonModel.findById(req.params.id).lean();

    if (!data) {
      res.status(404).json({
        success: false,
        error: 'Missing person not found',
        timestamp: new Date(),
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
