import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Get all quotation settings
export async function GET() {
  try {
    const pool = getPool();
    
    // Fetch all settings in parallel
    const [
      cameraTypes,
      brands,
      channels,
      pixels,
      techTypes,
      storage,
      cables,
      accessories,
      settings,
      brandPricing
    ] = await Promise.all([
      pool.query('SELECT * FROM camera_types WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM brands WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM channel_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM pixel_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM camera_tech_types WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM storage_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM cable_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM accessories WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM quotation_settings'),
      pool.query(`
        SELECT bctp.*, b.name as brand_name, ct.name as camera_type_name
        FROM brand_camera_type_pricing bctp
        JOIN brands b ON bctp.brand_id = b.id
        JOIN camera_types ct ON bctp.camera_type_id = ct.id
        ORDER BY b.display_order, ct.display_order
      `)
    ]);

    // Convert settings array to object
    const settingsObj: Record<string, string> = {};
    settings.rows.forEach((row: any) => {
      settingsObj[row.setting_key] = row.setting_value;
    });

    // Organize brand pricing by brand and camera type
    const brandsWithPricing = brands.rows.map((brand: any) => {
      const brandPrices: Record<string, number> = {};
      brandPricing.rows
        .filter((bp: any) => bp.brand_id === brand.id)
        .forEach((bp: any) => {
          brandPrices[`camera_type_${bp.camera_type_id}`] = parseFloat(bp.price);
        });
      return {
        ...brand,
        pricing: brandPrices
      };
    });

    return NextResponse.json({
      cameraTypes: cameraTypes.rows,
      brands: brandsWithPricing,
      channels: channels.rows,
      pixels: pixels.rows,
      techTypes: techTypes.rows,
      storage: storage.rows,
      cables: cables.rows,
      accessories: accessories.rows,
      settings: settingsObj
    });
  } catch (err) {
    console.error('Database error in /api/quotation-settings:', err);
    return NextResponse.json(
      { error: 'Failed to fetch quotation settings', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Update quotation settings
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { table, id, ...settings } = body;
    
    const pool = getPool();
    
    // Update settings in the quotation_settings table
    if (table === 'settings') {
      const updatePromises = [];
      
      for (const [key, value] of Object.entries(settings)) {
        updatePromises.push(
          pool.query(
            `INSERT INTO quotation_settings (setting_key, setting_value)
             VALUES ($1, $2)
             ON CONFLICT (setting_key)
             DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
            [key, value]
          )
        );
      }
      
      await Promise.all(updatePromises);
      
      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    }
    
    return NextResponse.json({ error: 'Invalid table specified' }, { status: 400 });
  } catch (err) {
    console.error('Database error in PUT /api/quotation-settings:', err);
    return NextResponse.json(
      { error: 'Failed to update settings', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
