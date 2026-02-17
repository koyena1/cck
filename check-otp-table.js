const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function checkTable() {
  try {
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_otp_verification'
      );
    `);
    
    console.log('Table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get table structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'customer_otp_verification'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable structure:');
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      // Check for unique constraints
      const constraints = await pool.query(`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'customer_otp_verification';
      `);
      
      console.log('\nConstraints:');
      constraints.rows.forEach(c => {
        console.log(`  ${c.constraint_name}: ${c.constraint_type}`);
      });
    } else {
      console.log('\n⚠️ Table does not exist. Need to run migration.');
      console.log('\nCreating table...');
      
      await pool.query(`
        DROP TABLE IF EXISTS customer_otp_verification CASCADE;
        
        CREATE TABLE customer_otp_verification (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(6) NOT NULL,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_at TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          attempts INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_customer_otp_email ON customer_otp_verification(email);
        CREATE INDEX idx_customer_otp_expires ON customer_otp_verification(expires_at);
        CREATE INDEX idx_customer_otp_verified ON customer_otp_verification(is_verified);
      `);
      
      console.log('✅ Table created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
