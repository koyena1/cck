import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Test database connection
    const connectionTest = await pool.query('SELECT NOW()');
    
    // Check if customers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    // If table exists, get count
    let customerCount = 0;
    if (tableExists) {
      const countResult = await pool.query('SELECT COUNT(*) FROM customers');
      customerCount = parseInt(countResult.rows[0].count);
    }
    
    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        currentTime: connectionTest.rows[0].now
      },
      customersTable: {
        exists: tableExists,
        count: customerCount
      }
    });
    
  } catch (err: any) {
    console.error('Database test error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.code,
      detail: err.detail
    }, { status: 500 });
  }
}
