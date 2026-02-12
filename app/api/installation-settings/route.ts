import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch installation and AMC settings
export async function GET() {
  try {
    const pool = getPool();
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
          },
          codAdvanceAmount: 200,
          codPercentage: 10
        }
      });
    }

    const settings = result.rows[0];
    
    return NextResponse.json({
      success: true,
      settings: {
        installationCost: parseFloat(settings.installation_cost),
        amcOptions: settings.amc_options,
        codAdvanceAmount: settings.cod_advance_amount != null ? parseFloat(settings.cod_advance_amount) : 200,
        codPercentage: settings.cod_percentage != null ? parseFloat(settings.cod_percentage) : 10
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
    const pool = getPool();
    const body = await request.json();
    const { installationCost, amcOptions, codAdvanceAmount, codPercentage } = body;

    console.log('📝 Saving installation settings FULL BODY:', body);
    console.log('🔍 COD Advance Amount received:', codAdvanceAmount);
    console.log('🔍 COD Advance Amount type:', typeof codAdvanceAmount);
    console.log('🔍 COD Percentage received:', codPercentage);
    console.log('🔍 COD Percentage type:', typeof codPercentage);
    
    const finalCodAmount = codAdvanceAmount ?? 200;
    const finalCodPercentage = codPercentage ?? 10;
    console.log('💾 Final COD amount to save:', finalCodAmount);
    console.log('💾 Final COD percentage to save:', finalCodPercentage);

    // Check if settings exist
    const checkResult = await pool.query(
      'SELECT id FROM installation_settings LIMIT 1'
    );

    console.log('🔍 Existing records found:', checkResult.rows.length);

    if (checkResult.rows.length === 0) {
      // Insert new settings
      console.log('➕ Inserting new record...');
      const insertResult = await pool.query(
        `INSERT INTO installation_settings (installation_cost, amc_options, cod_advance_amount, cod_percentage, updated_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
        [installationCost, JSON.stringify(amcOptions), finalCodAmount, finalCodPercentage]
      );
      console.log('✅ Inserted with ID:', insertResult.rows[0].id);
    } else {
      // Update existing settings
      console.log('🔄 Updating existing record ID:', checkResult.rows[0].id);
      await pool.query(
        `UPDATE installation_settings 
         SET installation_cost = $1, amc_options = $2, cod_advance_amount = $3, cod_percentage = $4, updated_at = NOW()
         WHERE id = $5`,
        [installationCost, JSON.stringify(amcOptions), finalCodAmount, finalCodPercentage, checkResult.rows[0].id]
      );
      console.log('✅ Updated successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error: any) {
    console.error('❌ Error updating installation settings:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings', details: error.detail },
      { status: 500 }
    );
  }
}
