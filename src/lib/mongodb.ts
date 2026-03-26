import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;
const MONGODB_AUTH_URL = process.env.MONGODB_AUTH_URL;

if (!MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable inside .env.local');
}

if (!MONGODB_AUTH_URL) {
  throw new Error('Please define the MONGODB_AUTH_URL environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
  var mongooseAuthConnectionPromise: Promise<mongoose.Connection> | undefined;
}

// Global cache to prevent multiple connections in development
const cached = globalThis.mongooseCache ?? (globalThis.mongooseCache = { conn: null, promise: null });

// Function to connect to the main database (mabilife)
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URL!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// Function to connect to the auth database (auth)
export async function connectToAuthDatabase() {
  if (!globalThis.mongooseAuthConnectionPromise) {
    globalThis.mongooseAuthConnectionPromise = mongoose.createConnection(MONGODB_AUTH_URL!).asPromise();
  }
  return globalThis.mongooseAuthConnectionPromise;
}
