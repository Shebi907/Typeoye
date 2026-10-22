import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import { createServer } from 'http';
import { connectDB } from './config/db';
import { env } from './config/env';
import { UPLOADS_DIR, ensureUploadDirs } from './config/uploads';
import { authLimiter, apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { googleOAuthRedirectUri } from './controllers/googleAuth.controller';
import User from './models/User';
import Lesson from './models/Lesson';
import Exercise from './models/Exercise';
import TypingSession from './models/TypingSession';
import TypingResult from './models/TypingResult';
import PracticeSession from './models/PracticeSession';
import Achievement from './models/Achievement';
import { seedUrduLessons } from './seed/urduLessons';
import { attachChallengeSocket } from './services/challenge.socket';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import lessonRoutes from './routes/lesson.routes';
import urduLessonRoutes from './routes/urduLesson.routes';
import typingRoutes from './routes/typing.routes';
import analyticsRoutes from './routes/analytics.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import practiceRoutes from './routes/practice.routes';
import gamesRoutes from './routes/games.routes';
import certificateRoutes from './routes/certificate.routes';
import contactRoutes from './routes/contact.routes';
import challengeRoutes from './routes/challenge.routes';
import urduContentRoutes from './routes/urduContent.routes';

export function createApp() {
  const app = express();

  // Render (and most PaaS hosts) sit behind a reverse proxy that sets
  // X-Forwarded-For. Trust exactly one hop so express-rate-limit and any
  // req.ip usage correctly identify the real client instead of Render's proxy.
  app.set('trust proxy', 1);

  ensureUploadDirs();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      // The SPA is served from a different origin than this API, so every
      // mutating request pays for an OPTIONS round-trip first. Without a
      // freshness hint the browser re-preflights almost every call, and one
      // slow preflight pushes the total past the client's request timeout.
      maxAge: 600,
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
  app.use('/api/urdu-lessons', urduLessonRoutes);
  app.use('/api/typing', typingRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/practice', practiceRoutes);
  app.use('/api/games', gamesRoutes);
  app.use('/api/challenge', challengeRoutes);
  app.use('/api/certificates', certificateRoutes);
  app.use('/api/contact', contactRoutes);
  app.use('/api/urdu-content', urduContentRoutes);

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

      // Migration: lessons/exercises created before the multi-language course
      // feature have no `language` field. Default them to English so the
      // existing course stays intact, then reconcile the Lesson indexes so the
      // new per-language `{ language, order }` uniqueness can be enforced.
      try {
        await Promise.all([
          Lesson.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
          Exercise.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
        ]);
        await Lesson.collection.dropIndex('order_1').catch(() => undefined);
        await Lesson.createIndexes();
      } catch (err) {
        console.error('[db] Lesson language migration error:', err);
      }

      // Migration: sessions, results, practice sessions and achievements
      // created before the language field existed default to English. Without
      // this backfill the (now language-scoped) queries would silently drop all
      // historic English data — losing the user's visible progress.
      try {
        await Promise.all([
          TypingSession.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
          TypingResult.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
          PracticeSession.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
          Achievement.updateMany({ language: { $exists: false } }, { $set: { language: 'en' } }),
        ]);
      } catch (err) {
        console.error('[db] language backfill migration error:', err);
      }

      try {
        const urdu = await seedUrduLessons();
        console.log(`[db] Urdu course ready: ${urdu.lessons} levels, ${urdu.exercises} exercises`);
      } catch (err) {
        console.error('[db] Urdu seeding error:', err);
      }

      const PORT = Number(process.env.PORT) || 5000;
      const app = createApp();
      const server = createServer(app);
      attachChallengeSocket(server);
      console.log(`   Google OAuth redirect_uri: ${googleOAuthRedirectUri()}`);
      server.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Typeoye server running on port ${PORT}`);
        console.log(`   Environment: ${env.NODE_ENV}`);
      });
      server.on('error', (err) => {
        console.error(`[server] FAILED to listen on port ${PORT}:`, err);
        process.exit(1);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}