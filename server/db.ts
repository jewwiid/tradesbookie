import dotenv from "dotenv";
dotenv.config();

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
neonConfig.pipelineTLS = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with proper configuration for serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Reduce max connections for serverless
  idleTimeoutMillis: 10000, // Reduce idle timeout
  connectionTimeoutMillis: 5000, // Reduce connection timeout
});

export const db = drizzle({ client: pool, schema });

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Test the connection first with a shorter timeout
    console.log("Testing database connection...");
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log("Database connection successful");

    // Use npm run db:push instead of manual table creation
    console.log("Database schema should be managed via: npm run db:push");
    console.log("Database initialization completed");
    
  } catch (error) {
    console.log("Database connection failed, continuing with limited functionality:", error);
    // Don't throw error - let app continue with fallback behavior
  }
}