import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const BUSINESS_SECTIONS = [
  { key: 'best-seller', name: 'Best Seller' },
  { key: 'biometric-access', name: 'Biometric Access' },
  { key: 'gps-system', name: 'GPS System' },
  { key: 'system', name: 'System' },
  { key: 'fire-alarm', name: 'Fire Alarm' },
  { key: 'intercom-system', name: 'Intercom System' },
  { key: 'motion-detection', name: 'Motion Detection' },
  { key: 'pa-system', name: 'PA System' },
  { key: 'combo-products', name: 'Combo Products' },
] as const;

const BUSINESS_KEYS: Set<string> = new Set(BUSINESS_SECTIONS.map((item) => item.key));

function normalizeBusinessKey(value: unknown) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'best-seller';

  const slug = raw.replace(/[\s_]+/g, '-');
  if (BUSINESS_KEYS.has(slug)) return slug;

  const byName = BUSINESS_SECTIONS.find((section) => section.name.toLowerCase() === raw);
  return byName?.key || 'best-seller';
}

async function ensureBestsellerTable() {
  const pool = getPool();
  await pool.query(`
    ALTER TABLE dealer_products
    ADD COLUMN IF NOT EXISTS image_url TEXT
  `);

  await pool.query(`
    ALTER TABLE dealer_products
    ADD COLUMN IF NOT EXISTS original_price NUMERIC(10, 2)
  `);

  await pool.query(`
    ALTER TABLE dealer_products
    ADD COLUMN IF NOT EXISTS manual_sold INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS homepage_bestseller_products (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL UNIQUE REFERENCES dealer_products(id) ON DELETE CASCADE,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE homepage_bestseller_products
    ADD COLUMN IF NOT EXISTS business_name TEXT NOT NULL DEFAULT 'best-seller'
  `);

  await pool.query(`
    ALTER TABLE homepage_bestseller_products
    ALTER COLUMN business_name SET DEFAULT 'best-seller'
  `);

  await pool.query(`
    UPDATE homepage_bestseller_products
    SET business_name = 'best-seller'
    WHERE business_name IS NULL OR BTRIM(business_name) = ''
  `);

  // Move previously global rows (migrated as 'system') into dedicated best-seller bucket.
  await pool.query(`
    UPDATE homepage_bestseller_products
    SET business_name = 'best-seller'
    WHERE business_name = 'system'
  `);

  await pool.query(`
    UPDATE homepage_bestseller_products
    SET business_name = CASE
      WHEN business_name IS NULL OR BTRIM(business_name) = '' THEN 'best-seller'
      WHEN LOWER(BTRIM(business_name)) IN ('best seller', 'best_seller', 'bestseller', 'best-seller') THEN 'best-seller'
      WHEN LOWER(BTRIM(business_name)) IN ('biometric access', 'biometric_access', 'biometric-access') THEN 'biometric-access'
      WHEN LOWER(BTRIM(business_name)) IN ('gps system', 'gps_system', 'gps-system') THEN 'gps-system'
      WHEN LOWER(BTRIM(business_name)) IN ('system') THEN 'system'
      WHEN LOWER(BTRIM(business_name)) IN ('fire alarm', 'fire_alarm', 'fire-alarm') THEN 'fire-alarm'
      WHEN LOWER(BTRIM(business_name)) IN ('intercom system', 'intercom_system', 'intercom-system') THEN 'intercom-system'
      WHEN LOWER(BTRIM(business_name)) IN ('motion detection', 'motion_detection', 'motion-detection') THEN 'motion-detection'
      WHEN LOWER(BTRIM(business_name)) IN ('pa system', 'pa_system', 'pa-system') THEN 'pa-system'
      WHEN LOWER(BTRIM(business_name)) IN ('combo products', 'combo_products', 'combo-products') THEN 'combo-products'
      ELSE 'best-seller'
    END
    WHERE business_name IS NULL
      OR business_name !~ '^[a-z0-9-]+$'
      OR business_name NOT IN ('best-seller', 'biometric-access', 'gps-system', 'system', 'fire-alarm', 'intercom-system', 'motion-detection', 'pa-system', 'combo-products')
  `);

  await pool.query(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY business_name, product_id
          ORDER BY display_order ASC, id ASC
        ) AS rn
      FROM homepage_bestseller_products
    )
    DELETE FROM homepage_bestseller_products hb
    USING ranked r
    WHERE hb.id = r.id
      AND r.rn > 1
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'homepage_bestseller_products'
          AND constraint_name = 'homepage_bestseller_products_product_id_key'
      ) THEN
        ALTER TABLE homepage_bestseller_products
        DROP CONSTRAINT homepage_bestseller_products_product_id_key;
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_homepage_bestseller_business_product
    ON homepage_bestseller_products (business_name, product_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_homepage_bestseller_business
    ON homepage_bestseller_products (business_name)
  `);
}

export async function GET(request: Request) {
  try {
    await ensureBestsellerTable();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const businessKey = normalizeBusinessKey(searchParams.get('business'));

    const result = await pool.query(`
      WITH order_sales AS (
        SELECT
          oi.product_id,
          SUM(COALESCE(oi.quantity, 1))::int AS sold_qty
        FROM order_items oi
        INNER JOIN orders o ON o.order_id = oi.order_id
        WHERE oi.product_id IS NOT NULL
          AND oi.item_type = 'Product'
          AND o.status IN ('Delivered', 'Completed')
        GROUP BY oi.product_id
      ),
      inventory_sales AS (
        SELECT
          di.product_id,
          SUM(COALESCE(di.quantity_sold, 0))::int AS sold_qty
        FROM dealer_inventory di
        GROUP BY di.product_id
      )
      SELECT
        dp.id,
        dp.model_number AS product_name,
        dp.company AS brand_name,
        CASE
          WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
            OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
          THEN '/pdt.png'
          ELSE dp.image_url
        END AS image,
        COALESCE(dp.base_price, 0)::numeric AS base_price,
        COALESCE(dp.original_price, NULL)::numeric AS original_price,
        dp.segment,
        COALESCE(dp.description, '') AS product_description,
        COALESCE(dp.specifications, '') AS product_specifications,
        COALESCE(dp.manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) AS sold,
        CASE WHEN hb.product_id IS NOT NULL AND hb.is_active = true THEN true ELSE false END AS selected,
        COALESCE(hb.display_order, 9999) AS display_order
      FROM dealer_products dp
      LEFT JOIN homepage_bestseller_products hb
        ON hb.product_id = dp.id
        AND hb.business_name = $1
      LEFT JOIN order_sales os ON os.product_id = dp.id
      LEFT JOIN inventory_sales inv ON inv.product_id = dp.id
      WHERE dp.is_active = true
      ORDER BY selected DESC, sold DESC, dp.model_number ASC
    `, [businessKey]);

    return NextResponse.json({ success: true, business: businessKey, sections: BUSINESS_SECTIONS, products: result.rows });
  } catch (error) {
    console.error('Error fetching admin bestseller products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bestseller products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBestsellerTable();
    const pool = getPool();
    const body = await request.json();
    const businessKey = normalizeBusinessKey(body?.business);

    if (body?.action === 'removeFromHomepage') {
      const productId = Number(body?.productId);
      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json({ success: false, error: 'Valid productId is required' }, { status: 400 });
      }

      await pool.query('DELETE FROM homepage_bestseller_products WHERE business_name = $1 AND product_id = $2', [businessKey, productId]);
      return NextResponse.json({ success: true });
    }

    if (body?.action === 'createProduct') {
      const {
        brand_name,
        segment,
        product_name,
        product_description,
        product_specifications,
        base_price,
        original_price,
        sold,
        image_url,
      } = body;

      const normalizedCompany = String(brand_name || '').trim();
      const normalizedSegment = String(segment || '').trim();
      const normalizedModel = String(product_name || '').trim();

      if (!normalizedCompany || !normalizedSegment || !normalizedModel) {
        return NextResponse.json(
          { success: false, error: 'Brand name, segment and product name are required' },
          { status: 400 }
        );
      }

      const existing = await pool.query('SELECT id FROM dealer_products WHERE model_number = $1 LIMIT 1', [normalizedModel]);
      if (existing.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: `Model number already exists: ${normalizedModel}. Use a unique model number.` },
          { status: 409 }
        );
      }

      const created = await pool.query(
        `
          INSERT INTO dealer_products (
            company,
            segment,
            model_number,
            product_type,
            description,
            specifications,
            base_price,
            original_price,
            manual_sold,
            dealer_sale_price,
            in_stock,
            is_active,
            image_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $7, true, true, $10)
          RETURNING id
        `,
        [
          normalizedCompany,
          normalizedSegment,
          normalizedModel,
          'bestseller',
          product_description || '',
          product_specifications || '',
          Number(base_price) || 0,
          original_price !== undefined && original_price !== null && String(original_price) !== ''
            ? Number(original_price) || 0
            : null,
          Number(sold) || 0,
          image_url || null
        ]
      );

      const createdProductId = created.rows[0]?.id;

      if (createdProductId) {
        await pool.query(
          `
            INSERT INTO homepage_bestseller_products (business_name, product_id, display_order, is_active)
            VALUES ($1, $2, 0, true)
            ON CONFLICT (business_name, product_id)
            DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP
          `,
          [businessKey, createdProductId]
        );
      }

      return NextResponse.json({ success: true, productId: createdProductId });
    }

    if (body?.action === 'updateProduct') {
      const {
        productId,
        brand_name,
        segment,
        product_name,
        product_description,
        product_specifications,
        base_price,
        original_price,
        sold,
        image_url,
      } = body;

      const normalizedProductId = Number(productId);
      if (!Number.isInteger(normalizedProductId) || normalizedProductId <= 0) {
        return NextResponse.json({ success: false, error: 'Valid productId is required' }, { status: 400 });
      }

      const normalizedCompany = String(brand_name || '').trim();
      const normalizedSegment = String(segment || '').trim();
      const normalizedModel = String(product_name || '').trim();

      if (!normalizedCompany || !normalizedSegment || !normalizedModel) {
        return NextResponse.json(
          { success: false, error: 'Brand name, segment and product name are required' },
          { status: 400 }
        );
      }

      const exists = await pool.query('SELECT id FROM dealer_products WHERE id = $1 LIMIT 1', [normalizedProductId]);
      if (exists.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }

      const duplicate = await pool.query(
        'SELECT id FROM dealer_products WHERE model_number = $1 AND id <> $2 LIMIT 1',
        [normalizedModel, normalizedProductId]
      );

      if (duplicate.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: `Model number already exists: ${normalizedModel}. Use a unique model number.` },
          { status: 409 }
        );
      }

      await pool.query(
        `
          UPDATE dealer_products
          SET
            company = $1,
            segment = $2,
            model_number = $3,
            description = $4,
            specifications = $5,
            base_price = $6,
            original_price = $7,
            manual_sold = $8,
            image_url = $9
          WHERE id = $10
        `,
        [
          normalizedCompany,
          normalizedSegment,
          normalizedModel,
          product_description || '',
          product_specifications || '',
          Number(base_price) || 0,
          original_price !== undefined && original_price !== null && String(original_price) !== ''
            ? Number(original_price) || 0
            : null,
          Number(sold) || 0,
          image_url ? String(image_url).trim() : null,
          normalizedProductId,
        ]
      );

      return NextResponse.json({ success: true, productId: normalizedProductId });
    }

    const selectedProductIds = Array.isArray(body?.selectedProductIds)
      ? body.selectedProductIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    await pool.query('BEGIN');

    try {
      await pool.query('DELETE FROM homepage_bestseller_products WHERE business_name = $1', [businessKey]);

      for (let i = 0; i < selectedProductIds.length; i += 1) {
        await pool.query(
          `
            INSERT INTO homepage_bestseller_products (business_name, product_id, display_order, is_active)
            VALUES ($1, $2, $3, true)
          `,
          [businessKey, selectedProductIds[i], i + 1]
        );
      }

      await pool.query('COMMIT');
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

    return NextResponse.json({ success: true, business: businessKey, selectedCount: selectedProductIds.length });
  } catch (error) {
    console.error('Error saving admin bestseller products:', error);
    return NextResponse.json({ success: false, error: 'Failed to save bestseller products' }, { status: 500 });
  }
}
