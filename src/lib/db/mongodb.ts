import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global cache interface for Mongoose connection in Next.js.
 * In development, hot module replacement can create duplicate connection pools.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  status: "connected" | "connecting" | "disconnected" | "unconfigured";
  error: string | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  status: "disconnected",
  error: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<{
  mongoose: typeof mongoose | null;
  status: "connected" | "connecting" | "disconnected" | "unconfigured";
  error: string | null;
}> {
  if (!MONGODB_URI) {
    cached.status = "unconfigured";
    cached.error = "MONGODB_URI environment variable is not defined.";
    return { mongoose: null, status: "unconfigured", error: cached.error };
  }

  if (cached.conn) {
    cached.status = "connected";
    return { mongoose: cached.conn, status: "connected", error: null };
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.status = "connecting";
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        cached.status = "connected";
        cached.error = null;
        return mongooseInstance;
      })
      .catch((err: Error) => {
        cached.promise = null;
        cached.status = "disconnected";
        cached.error = err.message;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    cached.status = "connected";
    return { mongoose: cached.conn, status: "connected", error: null };
  } catch (err) {
    return {
      mongoose: null,
      status: "disconnected",
      error: err instanceof Error ? err.message : "Failed to connect to MongoDB",
    };
  }
}

export function getDatabaseState(): {
  status: "connected" | "connecting" | "disconnected" | "unconfigured";
  hasUri: boolean;
  error: string | null;
} {
  return {
    status: cached.status,
    hasUri: Boolean(MONGODB_URI),
    error: cached.error,
  };
}
