/**
 * Update Dealer Coordinates Helper
 * Helps add or update latitude/longitude for dealers
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateDealerCoordinates() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🗺️  DEALER COORDINATES UPDATE UTILITY');
    console.log('='.repeat(70) + '\n');

    // List dealers without coordinates
    const missingCoordsResult = await pool.query(`
      SELECT dealer_id, business_name, location, business_address
      FROM dealers
      WHERE latitude IS NULL OR longitude IS NULL
      ORDER BY dealer_id
    `);

    if (missingCoordsResult.rows.length === 0) {
      console.log('✅ All dealers have coordinates set!\n');
      
      // Show dealers with coordinates
      const allDealersResult = await pool.query(`
        SELECT dealer_id, business_name, location, latitude, longitude
        FROM dealers
        ORDER BY dealer_id
      `);
      
      console.log('Current dealers:\n');
      allDealersResult.rows.forEach(dealer => {
        console.log(`  ${dealer.dealer_id}. ${dealer.business_name}`);
        console.log(`     Location: ${dealer.location}`);
        console.log(`     Coordinates: ${dealer.latitude}, ${dealer.longitude}\n`);
      });
      
      rl.close();
      await pool.end();
      return;
    }

    console.log(`⚠️  Found ${missingCoordsResult.rows.length} dealer(s) without coordinates:\n`);

    for (const dealer of missingCoordsResult.rows) {
      console.log('─'.repeat(70));
      console.log(`\nDealer ID: ${dealer.dealer_id}`);
      console.log(`Business Name: ${dealer.business_name}`);
      console.log(`Location: ${dealer.location || 'Not specified'}`);
      console.log(`Address: ${dealer.business_address || 'Not specified'}`);
      
      console.log('\n💡 To find coordinates:');
      console.log('   1. Go to https://www.google.com/maps');
      console.log('   2. Search for the address');
      console.log('   3. Right-click on the location marker');
      console.log('   4. Copy the coordinates (first number is latitude, second is longitude)\n');

      const update = await question('Do you want to update coordinates for this dealer? (y/n): ');
      
      if (update.toLowerCase() === 'y' || update.toLowerCase() === 'yes') {
        const latitude = await question('Enter latitude (e.g., 22.5726): ');
        const longitude = await question('Enter longitude (e.g., 88.3639): ');
        
        // Validate input
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lon)) {
          console.log('❌ Invalid coordinates. Skipping...\n');
          continue;
        }
        
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          console.log('❌ Coordinates out of range. Skipping...\n');
          continue;
        }
        
        // Update database
        await pool.query(`
          UPDATE dealers
          SET latitude = $1, longitude = $2
          WHERE dealer_id = $3
        `, [lat, lon, dealer.dealer_id]);
        
        console.log(`✅ Updated coordinates for ${dealer.business_name}\n`);
      } else {
        console.log('⏭️  Skipped\n');
      }
    }

    console.log('='.repeat(70));
    
    // Show summary
    const updatedResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(latitude) as with_coords,
        COUNT(*) - COUNT(latitude) as without_coords
      FROM dealers
    `);
    
    const summary = updatedResult.rows[0];
    console.log('\n📊 Summary:');
    console.log(`   Total Dealers: ${summary.total}`);
    console.log(`   With Coordinates: ${summary.with_coords}`);
    console.log(`   Without Coordinates: ${summary.without_coords}\n`);
    
    if (summary.without_coords > 0) {
      console.log('⚠️  Some dealers still missing coordinates. Run this script again to update them.\n');
    } else {
      console.log('✅ All dealers now have coordinates!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

// Bulk update mode
async function bulkUpdateCoordinates() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🗺️  BULK UPDATE DEALER COORDINATES');
    console.log('='.repeat(70) + '\n');

    // Example bulk updates - modify as needed
    const updates = [
      { dealer_id: 1, latitude: 22.5726, longitude: 88.3639 }, // Kolkata
      { dealer_id: 2, latitude: 22.4200, longitude: 87.3200 }, // Tamluk
      { dealer_id: 3, latitude: 22.4200, longitude: 87.3200 }, // Tamluk
      // Add more as needed
    ];

    console.log(`Updating ${updates.length} dealer(s)...\n`);

    for (const update of updates) {
      const result = await pool.query(`
        UPDATE dealers
        SET latitude = $1, longitude = $2
        WHERE dealer_id = $3
        RETURNING dealer_id, business_name
      `, [update.latitude, update.longitude, update.dealer_id]);

      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].business_name} (${update.latitude}, ${update.longitude})`);
      } else {
        console.log(`⚠️  Dealer ID ${update.dealer_id} not found`);
      }
    }

    console.log('\n✅ Bulk update completed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--bulk')) {
    await bulkUpdateCoordinates();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node update-dealer-coordinates.js [OPTIONS]

Update dealer latitude/longitude coordinates.

Options:
  --bulk         Run in bulk update mode (edit script to set coordinates)
  --help, -h     Show this help message

Interactive Mode (default):
  node update-dealer-coordinates.js

Bulk Mode:
  node update-dealer-coordinates.js --bulk

In interactive mode, you'll be prompted for each dealer without coordinates.
In bulk mode, coordinates are updated from the hardcoded list in the script.
    `);
  } else {
    await updateDealerCoordinates();
  }
}

main();
