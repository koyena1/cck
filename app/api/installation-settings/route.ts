import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET - Fetch installation and AMC settings
export async function GET() {
  try {
    const result = await pool.query(
      'SELECT * FROM installation_settings ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return NextResponse.json({
        success: true,
        settings: {
          installationCost: 5000,
          amcOptions: {
            with_1year: 400,
            with_2year: 700,
            without_1year: 250,
            without_2year: 200
          }
        }
      });
    }

    const settings = result.rows[0];
    
    return NextResponse.json({
      success: true,
      settings: {
        installationCost: parseFloat(settings.installation_cost),
        amcOptions: settings.amc_options
      }
    });
  } catch (error) {
    console.error('Error fetching installation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST/PUT - Update installation and AMC settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { installationCost, amcOptions } = body;

    // Check if settings exist
    const checkResult = await pool.query(
      'SELECT id FROM installation_settings LIMIT 1'
    );

    if (checkResult.rows.length === 0) {
      // Insert new settings
      await pool.query(
        `INSERT INTO installation_settings (installation_cost, amc_options, updated_at)
         VALUES ($1, $2, NOW())`,
        [installationCost, JSON.stringify(amcOptions)]
      );
    } else {
      // Update existing settings
      await pool.query(
        `UPDATE installation_settings 
         SET installation_cost = $1, amc_options = $2, updated_at = NOW()
         WHERE id = $3`,
        [installationCost, JSON.stringify(amcOptions), checkResult.rows[0].id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating installation settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
