import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import { connectDB } from './config/db';
import { env } from './config/env';
import { UPLOADS_DIR, ensureUploadDirs } from './config/uploads';
import { authLimiter, apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import User from './models/User';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import lessonRoutes from './routes/lesson.routes';
import typingRoutes from './routes/typing.routes';
import analyticsRoutes from './routes/analytics.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import practiceRoutes from './routes/practice.routes';
import gamesRoutes from './routes/games.routes';
import certificateRoutes from './routes/certificate.routes';
import contactRoutes from './routes/contact.routes';

export function createApp() {
  const app = express();

  ensureUploadDirs();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  // Uploaded content (profile pictures, etc.)
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api', apiLimiter);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/lessons', lessonRoutes);
  app.use('/api/typing', typingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/practice', practiceRoutes);
  app.use('/api/games', gamesRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/contact', contactRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

if (require.main === module) {
  // Keep the API alive instead of silently dying on unexpected async failures.
  process.on('unhandledRejection', (reason) => {
    console.error('[process] Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[process] Uncaught exception:', err);
  });
  process.on('error', (err) => {
    console.error('[process] Error:', err);
  });

  connectDB()
    .then(async () => {
      // Safe migration strategy: ensure pre-existing accounts without emailVerified remain verified
      try {
        await User.updateMany(
          { emailVerified: { $exists: false } },
          { $set: { emailVerified: true } }
        );
      } catch (err) {
        console.error('[db] User emailVerified migration error:', err);
      }

      const app = createApp();
      const server = app.listen(env.PORT, () => {
        console.log(`🚀 Typeoye server running at http://localhost:${env.PORT}`);
        console.log(`   Environment: ${env.NODE_ENV}`);
      });
      server.on('error', (err) => {
        console.error(`[server] FAILED to listen on port ${env.PORT}:`, err);
        process.exit(1);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}
