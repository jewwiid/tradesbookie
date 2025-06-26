import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with proper configuration for serverless
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle({ client: pool, schema });

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Test the connection first
    console.log("Testing database connection...");
    await pool.query('SELECT 1');
    console.log("Database connection successful");

    // Use npm run db:push instead of manual table creation
    console.log("Database schema should be managed via: npm run db:push");
    console.log("Database initialization completed");
    
  } catch (error) {
    console.log("Database connection failed, continuing with limited functionality:", error);
    // Don't throw error - let app continue with fallback behavior
  }
}