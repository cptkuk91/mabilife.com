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

// Global cache to prevent multiple connections in development
let cached = (global as any).mongoose as MongooseCache;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

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
// Note: Mongoose typically handles one connection per instance easily. 
// For multiple databases, we use mongoose.createConnection.
let authConnection: mongoose.Connection | null = null;

export async function connectToAuthDatabase() {
  if (authConnection) {
    return authConnection;
  }

  authConnection = mongoose.createConnection(MONGODB_AUTH_URL!).asPromise().then((conn) => {
      return conn;
  }) as unknown as mongoose.Connection; // Type casting for compatibility if needed, though createConnection returns a Connection

  return authConnection;
}
