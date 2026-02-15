import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import missingPersonsRouter from './routes/missingPersons';
import analyticsRouter from './routes/analytics';

const app: Express = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/overwatch';

/**
 * Middleware setup
 */

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Request logging middleware
 */
app.use((req, express, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

/**
 * API routes
 */
app.use('/api/missing-persons', missingPersonsRouter);
app.use('/api/analytics', analyticsRouter);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    timestamp: new Date(),
  });
});

/**
 * Error handling middleware (must be last)
 */
app.use(errorHandler);

/**
 * Database connection and server startup
 */
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✓ MongoDB connected');

    // Start server
    app.listen(port, () => {
      console.log(`✓ Server running on port ${port}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.disconnect().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

startServer();

export default app;
