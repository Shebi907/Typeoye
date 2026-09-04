import mongoose from 'mongoose';
import { env } from './env';

/** Strip user:password credentials from a MongoDB URI before logging it so the
 *  database password never leaks into logs. */
function redactUri(uri: string): string {
  try {
    return uri.replace(/\/\/[^@/]+@/, '//***:***@');
  } catch {
    return uri;
  }
}

export async function connectDB(): Promise<void> {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(env.MONGODB_URI);
      console.log(`✅ MongoDB connected: ${redactUri(env.MONGODB_URI)}`);

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
      });

      return;
    } catch (error) {
      retries += 1;
      console.error(`MongoDB connection attempt ${retries}/${maxRetries} failed:`, error);
      if (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * retries));
      } else {
        console.error('❌ Could not connect to MongoDB after max retries. Exiting.');
        process.exit(1);
      }
    }
  }
}
