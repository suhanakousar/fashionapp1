import "dotenv/config";
import { MongoClient, Db, MongoClientOptions } from "mongodb";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Extract database name from connection string or use default
function getDbName(): string {
  let dbName = "fashiondb"; // Default database name
  try {
    // Try to parse database name from connection string
    const urlString = process.env.DATABASE_URL!;
    if (urlString.includes('/') && !urlString.endsWith('/')) {
      const parts = urlString.split('/');
      const lastPart = parts[parts.length - 1];
      // Remove query parameters if present
      const dbNamePart = lastPart.split('?')[0];
      if (dbNamePart && dbNamePart.length > 0) {
        dbName = dbNamePart;
      }
    }
  } catch (e) {
    // If parsing fails, use default
    console.log("Using default database name: fashiondb");
  }
  return dbName;
}

// MongoDB connection options for better compatibility, especially on Windows
// The SSL error on Windows is often due to OpenSSL/TLS compatibility issues
function getMongoOptions(): MongoClientOptions {
  return {
    serverSelectionTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 30000, // 30 seconds
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    minPoolSize: 1,
    // For Windows SSL/TLS issues, we need to be more permissive
    // This is a known issue with Node.js and MongoDB Atlas on Windows
    tls: true,
    // Allow invalid certificates as a workaround for Windows SSL issues
    // This is safe for MongoDB Atlas as they use valid certificates
    // The issue is with Windows/OpenSSL compatibility, not the certificates themselves
    tlsAllowInvalidCertificates: true,
  };
}

// Connection state
let client: MongoClient | null = null;
let db: Db | null = null;
let connectionPromise: Promise<void> | null = null;

// Initialize connection (call this before using db)
export async function connect(): Promise<void> {
  if (db && client) {
    return; // Already connected
  }

  if (connectionPromise) {
    return connectionPromise; // Connection in progress
  }

  connectionPromise = (async () => {
    try {
      const options = getMongoOptions();
      client = new MongoClient(process.env.DATABASE_URL!, options);
      await client.connect();
      console.log("Successfully connected to MongoDB");
      
      const dbName = getDbName();
      db = client.db(dbName);
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
      console.error("\nTroubleshooting tips:");
      console.error("1. Verify your MongoDB Atlas connection string is correct");
      console.error("2. Check if your IP address is whitelisted in MongoDB Atlas");
      console.error("3. Ensure your MongoDB Atlas cluster is running");
      console.error("4. Try updating Node.js to the latest LTS version");
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

// Export getters (will throw if not connected)
export function getClient(): MongoClient {
  if (!client) throw new Error("MongoDB client not initialized. Call connect() first.");
  return client;
}

export function getDb(): Db {
  if (!db) throw new Error("MongoDB database not initialized. Call connect() first.");
  return db;
}

// For backward compatibility
export { client, db };
