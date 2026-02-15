import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@overwatch/shared';

/**
 * Error handler middleware for Express
 * Handles validation errors, database errors, and unexpected errors
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err);

  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    timestamp: new Date(),
    data: null,
  };

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      ...response,
      error: 'Validation error',
      data: {
        issues: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // MongoDB validation errors
  if ((err as Record<string, unknown>).name === 'ValidationError') {
    res.status(400).json({
      ...response,
      error: 'Database validation error',
      data: (err as Record<string, unknown>).message,
    });
    return;
  }

  // MongoDB duplicate key error
  if ((err as Record<string, unknown>).code === 11000) {
    res.status(409).json({
      ...response,
      error: 'Duplicate entry',
      data: `Field already exists`,
    });
    return;
  }

  // MongoDB cast error (invalid ID format)
  if ((err as Record<string, unknown>).name === 'CastError') {
    res.status(400).json({
      ...response,
      error: 'Invalid ID format',
    });
    return;
  }

  // Default error response
  res.status(500).json(response);
}
