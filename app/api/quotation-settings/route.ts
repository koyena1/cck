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
      settings
    ] = await Promise.all([
      pool.query('SELECT * FROM camera_types WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM brands WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM channel_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM pixel_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM camera_tech_types WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM storage_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM cable_options WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM accessories WHERE is_active = true ORDER BY display_order'),
      pool.query('SELECT * FROM quotation_settings')
    ]);

    // Convert settings array to object
    const settingsObj: Record<string, string> = {};
    settings.rows.forEach((row: any) => {
      settingsObj[row.setting_key] = row.setting_value;
    });

    return NextResponse.json({
      cameraTypes: cameraTypes.rows,
      brands: brands.rows,
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
