import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  // Reuse existing connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  console.log('Creating new MongoDB connection');

  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 2,
      
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      
      // Performance
      maxIdleTimeMS: 30000,
      
      // Reliability
      retryWrites: true,
      w: 'majority',
    });

    cachedConnection = connection;
    return connection;

  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  cachedConnection = null;
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
  cachedConnection = null;
});
