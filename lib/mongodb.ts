import mongoose from 'mongoose';
import { env } from './env';

const MONGODB_URI = env.MONGODB_URI;
const MONGO_DB = env.MONGO_DB;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // Ako MONGODB_URI ne sadrži ime baze, dodaj ga
    let connectionUri = MONGODB_URI;
    
    // Proveri da li URI već sadrži ime baze
    const uriHasDb = /mongodb(\+srv)?:\/\/[^\/]+\/([^?]+)/.test(MONGODB_URI);
    
    if (!uriHasDb && MONGO_DB) {
      // Dodaj ime baze u URI
      const separator = MONGODB_URI.includes('?') ? '&' : '/';
      connectionUri = MONGODB_URI.replace(/\/(\?|$)/, `/${MONGO_DB}$1`);
    }
    
    const opts = {
      bufferCommands: false,
      dbName: MONGO_DB,
    };

    cached.promise = mongoose.connect(connectionUri, opts).then((mongoose) => {
      console.log('Connected to MongoDB database:', mongoose.connection.db?.databaseName || MONGO_DB);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

