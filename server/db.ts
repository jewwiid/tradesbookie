import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Initialize database tables
export async function initializeDatabase() {
  try {
    await pool.query(`
      -- Create sessions table for authentication
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

      -- Create users table
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create installers table
      CREATE TABLE IF NOT EXISTS installers (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR NOT NULL,
        contact_name VARCHAR NOT NULL,
        email VARCHAR UNIQUE NOT NULL,
        phone VARCHAR NOT NULL,
        address TEXT NOT NULL,
        service_area VARCHAR NOT NULL,
        base_fee_percentage DECIMAL(5,2) DEFAULT 15.00,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create fee_structures table
      CREATE TABLE IF NOT EXISTS fee_structures (
        id SERIAL PRIMARY KEY,
        installer_id INTEGER NOT NULL REFERENCES installers(id),
        service_type VARCHAR NOT NULL,
        fee_percentage DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(installer_id, service_type)
      );

      -- Create bookings table
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR UNIQUE NOT NULL,
        user_id VARCHAR REFERENCES users(id),
        installer_id INTEGER REFERENCES installers(id),
        business_id INTEGER NOT NULL DEFAULT 1,
        customer_name VARCHAR NOT NULL,
        customer_email VARCHAR NOT NULL,  
        customer_phone VARCHAR NOT NULL,
        tv_size VARCHAR NOT NULL,
        service_type VARCHAR NOT NULL,
        wall_type VARCHAR NOT NULL,
        mount_type VARCHAR NOT NULL,
        addons JSONB DEFAULT '[]'::jsonb,
        scheduled_date DATE NOT NULL,
        time_slot VARCHAR NOT NULL,
        address TEXT NOT NULL,
        room_photo_url VARCHAR,
        ai_preview_url VARCHAR,
        base_price DECIMAL(10,2) NOT NULL,
        addon_total DECIMAL(10,2) DEFAULT 0.00,
        total_price DECIMAL(10,2) NOT NULL,
        app_fee DECIMAL(10,2) NOT NULL,
        installer_earning DECIMAL(10,2) NOT NULL,
        status VARCHAR DEFAULT 'pending',
        customer_notes TEXT,
        installer_notes TEXT,
        qr_code VARCHAR UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Create job_assignments table
      CREATE TABLE IF NOT EXISTS job_assignments (
        id SERIAL PRIMARY KEY,
        installer_id INTEGER NOT NULL REFERENCES installers(id),
        booking_id INTEGER NOT NULL REFERENCES bookings(id),
        assigned_date TIMESTAMP DEFAULT NOW(),
        status VARCHAR DEFAULT 'assigned',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log("Database tables initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}