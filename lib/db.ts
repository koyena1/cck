// lib/db.ts - PostgreSQL connection utility
import { Pool } from 'pg';

let pool: Pool | null = null;

function createPool() {
  const createdPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });

  createdPool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error);
  });

  return createdPool;
}

export function getPool() {
  if (!pool) {
    // Validate required environment variables
    if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
      console.error('Missing database environment variables:', {
        DB_USER: !!process.env.DB_USER,
        DB_PASSWORD: !!process.env.DB_PASSWORD,
        DB_NAME: !!process.env.DB_NAME,
        DB_HOST: process.env.DB_HOST || 'localhost'
      });
      throw new Error('Database configuration is incomplete. Please check your .env file.');
    }

    try {
      pool = createPool();
      
      console.log('Database pool created successfully for:', process.env.DB_NAME);
    } catch (error) {
      console.error('Failed to create database pool:', error);
      throw error;
    }
  }
  return pool;
}

export async function resetPool() {
  if (!pool) return;

  const oldPool = pool;
  pool = null;

  try {
    await oldPool.end();
  } catch (error) {
    console.error('Error while closing PostgreSQL pool:', error);
  }
}

export default getPool;
