import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
  try {
    const pool = getPool();
    
    // Check if customers table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customers'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      return NextResponse.json({
        success: false,
        error: 'Customers table does not exist',
        message: 'Please run the setup-customer-auth-production.sql script on your database',
        tableExists: false
      }, { status: 500 });
    }
    
    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customers'
      ORDER BY ordinal_position;
    `);
    
    // Count customers
    const countResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    
    return NextResponse.json({
      success: true,
      tableExists: true,
      customerCount: parseInt(countResult.rows[0].count),
      columns: columns.rows,
      message: 'Database check completed successfully'
    });
    
  } catch (err: any) {
    console.error('Database check error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      code: err.code,
      detail: err.detail
    }, { status: 500 });
  }
}
