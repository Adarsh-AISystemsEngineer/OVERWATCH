import { Router, Request, Response, NextFunction } from 'express';
import { MissingPersonModel } from '../models/MissingPerson';
import { cacheMiddleware } from '../middleware/cache';
import { ApiResponse } from '@overwatch/shared';

const router = Router();

/**
 * GET /api/analytics/hotspots
 * Returns clustered hotspots of missing persons by geographic region
 * Supports heatmap visualization on map
 *
 * Aggregation Pipeline:
 * 1. Match: Filter by status and recent data
 * 2. Group: Cluster by geographic proximity (state + region)
 * 3. Project: Calculate statistics per cluster
 * 4. Sort: Highest incident density first
 */
router.get('/hotspots', cacheMiddleware(3600), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hotspotsData = await MissingPersonModel.aggregate([
      {
        // Stage 1: Filter to recent missing cases
        $match: {
          status: 'missing',
          lastSeenDate: {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
      },
      {
        // Stage 2: Group by state to identify hotspot regions
        $group: {
          _id: '$sourceState',
          missingCount: { $sum: 1 },
          foundCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'found'] }, 1, 0],
            },
          },
          averageAge: { $avg: '$age' },
          centerLocation: {
            $push: {
              coordinates: '$geolocation.coordinates',
              location: '$lastKnownLocation',
            },
          },
          latestDate: { $max: '$lastSeenDate' },
          genderDistribution: {
            $push: '$gender',
          },
        },
      },
      {
        // Stage 3: Calculate centroid of hotspot (average coordinates)
        $project: {
          state: '$_id',
          missingCount: 1,
          foundCount: 1,
          averageAge: { $round: ['$averageAge', 1] },
          latitude: {
            $avg: {
              $arrayElemAt: ['$centerLocation.coordinates', 1],
            },
          },
          longitude: {
            $avg: {
              $arrayElemAt: ['$centerLocation.coordinates', 0],
            },
          },
          latestDate: 1,
          riskScore: {
            $multiply: [
              { $divide: ['$missingCount', { $add: ['$missingCount', '$foundCount', 1] }] },
              100,
            ], // Missing/(Missing+Found) * 100
          },
          genderDistribution: 1,
        },
      },
      {
        // Stage 4: Sort by highest risk/incident count
        $sort: { missingCount: -1 },
      },
      {
        // Stage 5: Limit to top hotspots
        $limit: 20,
      },
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        hotspots: hotspotsData,
        totalHotspots: hotspotsData.length,
        generatedAt: new Date(),
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/trends
 * Timeline trend analysis - missing persons over time
 *
 * Aggregation Pipeline:
 * 1. Match: Filter recent data
 * 2. Group: Aggregate by month/year
 * 3. Project: Trend statistics
 * 4. Sort: Chronological order
 */
router.get('/trends', cacheMiddleware(1800), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trendsData = await MissingPersonModel.aggregate([
      {
        $match: {
          lastSeenDate: {
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          },
        },
      },
      {
        // Group by month
        $group: {
          _id: {
            year: { $year: '$lastSeenDate' },
            month: { $month: '$lastSeenDate' },
          },
          missingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'missing'] }, 1, 0],
            },
          },
          foundCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'found'] }, 1, 0],
            },
          },
          totalCount: { $sum: 1 },
          avgAge: { $avg: '$age' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: 1,
            },
          },
          missingCount: 1,
          foundCount: 1,
          totalCount: 1,
          avgAge: { $round: ['$avgAge', 1] },
          resolutionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$foundCount', { $add: ['$missingCount', '$foundCount', 1] }] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
    ]);

    const response: ApiResponse = {
      success: true,
      data: {
        trends: trendsData,
        period: 'Last 12 months',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/statistics
 * Overall statistics dashboard
 */
router.get('/statistics', cacheMiddleware(1800), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await MissingPersonModel.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalRecords: { $sum: 1 },
                missingCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'missing'] }, 1, 0],
                  },
                },
                foundCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'found'] }, 1, 0],
                  },
                },
                averageAge: { $avg: '$age' },
              },
            },
          ],
          byGender: [
            {
              $group: {
                _id: '$gender',
                count: { $sum: 1 },
                missingCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'missing'] }, 1, 0],
                  },
                },
              },
            },
            {
              $sort: { count: -1 },
            },
          ],
          byState: [
            {
              $group: {
                _id: '$sourceState',
                count: { $sum: 1 },
                missingCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'missing'] }, 1, 0],
                  },
                },
                foundCount: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'found'] }, 1, 0],
                  },
                },
              },
            },
            {
              $sort: { count: -1 },
            },
          ],
          ageRanges: [
            {
              $bucket: {
                groupBy: '$age',
                boundaries: [0, 10, 20, 30, 40, 50, 100, 200],
                default: 'Other',
                output: {
                  count: { $sum: 1 },
                  missingCount: {
                    $sum: {
                      $cond: [{ $eq: ['$status', 'missing'] }, 1, 0],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const [totals] = stats[0].totals;

    const response: ApiResponse = {
      success: true,
      data: {
        totals: {
          total: totals.totalRecords,
          missing: totals.missingCount,
          found: totals.foundCount,
          resolutionRate: (
            (totals.foundCount / (totals.missingCount + totals.foundCount)) *
            100
          ).toFixed(2),
          averageAge: totals.averageAge.toFixed(1),
        },
        byGender: stats[0].byGender,
        byState: stats[0].byState,
        ageRanges: stats[0].ageRanges,
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
