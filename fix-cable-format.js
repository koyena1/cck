// Fix cable format for existing products
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Koyen@123',
  database: 'cctv_platform',
  host: 'localhost',
  port: 5432,
  ssl: false,
});

async function fixCableFormat() {
  try {
    console.log('🔧 Fixing cable format for existing products...\n');

    // Update cable format from "90m" to "90 Meter" etc.
    const updates = [
      { old: '60m', new: '60 Meter' },
      { old: '90m', new: '90 Meter' },
      { old: '120m', new: '120 Meter' },
      { old: '180m', new: '180 Meter' },
      { old: '270m', new: '270 Meter' },
    ];

    for (const update of updates) {
      const result = await pool.query(
        'UPDATE hd_combo_products SET cable = $1 WHERE cable = $2',
        [update.new, update.old]
      );
      if (result.rowCount > 0) {
        console.log(`✓ Updated ${result.rowCount} product(s): "${update.old}" → "${update.new}"`);
      }
    }

    console.log('\n✅ Cable format fixed for all products!');
    console.log('\n🎉 Now refresh your frontend page to see the products!');
    
  } catch (error) {
    console.error('\n❌ Error fixing cable format:');
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

fixCableFormat();
