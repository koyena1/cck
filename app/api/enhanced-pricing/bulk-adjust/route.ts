import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv_platform',
  password: process.env.DB_PASSWORD || 'Koyen@123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// POST - Bulk adjust all prices by percentage
export async function POST(request: Request) {
  try {
    const { percentage } = await request.json();

    if (typeof percentage !== 'number' || isNaN(percentage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid percentage value' },
        { status: 400 }
      );
    }

    if (percentage === 0) {
      return NextResponse.json(
        { success: false, error: 'Percentage cannot be zero' },
        { status: 400 }
      );
    }

    // Calculate multiplier (e.g., 10% increase = 1.10, 10% decrease = 0.90)
    const multiplier = 1 + (percentage / 100);

    // Update all pricing tables
    const [cameras, hdAcc, ipAcc, cables, installation, amc] = await Promise.all([
      // Update camera pricing
      pool.query(
        'UPDATE camera_pricing SET price = ROUND((price * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      ),
      
      // Update HD accessories pricing
      pool.query(
        'UPDATE hd_accessories_pricing SET total_cost = ROUND((total_cost * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      ),
      
      // Update IP accessories pricing
      pool.query(
        'UPDATE ip_accessories_pricing SET total_cost = ROUND((total_cost * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      ),
      
      // Update cable pricing
      pool.query(
        'UPDATE cable_options_pricing SET price = ROUND((price * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      ),
      
      // Update installation pricing
      pool.query(
        'UPDATE installation_pricing SET price_per_camera = ROUND((price_per_camera * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      ),
      
      // Update AMC pricing
      pool.query(
        'UPDATE amc_pricing SET price_per_camera = ROUND((price_per_camera * $1)::numeric, 2) WHERE is_active = true RETURNING id',
        [multiplier]
      )
    ]);

    return NextResponse.json({
      success: true,
      message: `All prices ${percentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentage)}%`,
      percentage,
      updated: {
        cameras: cameras.rowCount,
        hd_accessories: hdAcc.rowCount,
        ip_accessories: ipAcc.rowCount,
        cables: cables.rowCount,
        installation: installation.rowCount,
        amc: amc.rowCount
      }
    });
  } catch (error) {
    console.error('Bulk price adjustment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to adjust prices' },
      { status: 500 }
    );
  }
}
