import mongoose from 'mongoose';

// Define the type for the cached connection
type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Global cache for the mongoose connection
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection | undefined;
}

/**
 * Establishes and caches a MongoDB connection using Mongoose
 * @returns Promise<mongoose> - The mongoose connection instance
 * @throws Error - If connection fails or MONGODB_URI is not defined
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Check if MONGODB_URI is defined in environment variables
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  // Use global cache to prevent multiple connections during development
  const cached: CachedConnection = global.mongoose || {
    conn: null,
    promise: null,
  };

  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      // Buffer commands until the connection is established
      bufferCommands: true,
      // Server selection timeout in milliseconds
      serverSelectionTimeoutMS: 5000,
      // Socket timeout in milliseconds
      socketTimeoutMS: 45000,
      // Maximum number of socket connections
      maxPoolSize: 10,
      // Minimum number of socket connections
      minPoolSize: 2,
      // Enable retryable writes
      retryWrites: true,
      // Enable retryable reads
      retryReads: true,
    };

    // Create connection promise
    cached.promise = mongoose.connect(mongoUri, opts)
      .then((mongooseInstance) => {
        // Log successful connection
        console.log('MongoDB connected successfully');
        
        // Handle connection events
        mongooseInstance.connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
        });

        mongooseInstance.connection.on('disconnected', () => {
          console.warn('MongoDB disconnected');
        });

        mongooseInstance.connection.on('reconnected', () => {
          console.log('MongoDB reconnected');
        });

        return mongooseInstance;
      })
      .catch((error) => {
        // Clear the promise on failure to allow retry
        cached.promise = null;
        console.error('MongoDB connection failed:', error);
        throw error;
      });
  }

  try {
    // Wait for connection to establish
    cached.conn = await cached.promise;
  } catch (error) {
    // Clear the promise on failure
    cached.promise = null;
    throw error;
  }

  // Cache the connection globally
  global.mongoose = cached;

  return cached.conn;
}

/**
 * Gracefully closes the MongoDB connection
 * Useful for cleanup during application shutdown
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
    
    // Clear global cache
    if (global.mongoose) {
      global.mongoose.conn = null;
      global.mongoose.promise = null;
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
}

/**
 * Checks if MongoDB is connected
 * @returns boolean - True if connected, false otherwise
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Gets the current connection state
 * @returns string - Current connection state description
 */
export function getConnectionState(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}
