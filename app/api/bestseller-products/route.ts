import { NextRequest, NextResponse } from 'next/server';
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

const FALLBACK_SEGMENT_PATTERNS: Record<string, string[]> = {
  'best-seller': [],
  'biometric-access': ['%biometric%', '%access%'],
  'gps-system': ['%gps%'],
  system: ['%system%'],
  'fire-alarm': ['%fire%', '%alarm%'],
  'intercom-system': ['%intercom%'],
  'motion-detection': ['%motion%'],
  'pa-system': ['%pa%', '%public address%'],
  'combo-products': ['%combo%'],
};

const BUSINESS_KEYS: Set<string> = new Set(BUSINESS_SECTIONS.map((item) => item.key));

function normalizeBusinessKey(value: unknown) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'best-seller';

  const slug = raw.replace(/[\s_]+/g, '-');
  if (BUSINESS_KEYS.has(slug)) return slug;

  const byName = BUSINESS_SECTIONS.find((section) => section.name.toLowerCase() === raw);
  return byName?.key || 'best-seller';
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getFallbackPatterns(businessKey: string | null) {
  if (!businessKey) return [];
  return FALLBACK_SEGMENT_PATTERNS[businessKey] || [];
}

async function fetchFallbackProducts(pool: ReturnType<typeof getPool>, businessKey: string | null, limit: number) {
  const patterns = getFallbackPatterns(businessKey);
  const hasPatterns = patterns.length > 0;
  const businessParamIndex = hasPatterns ? 2 : 1;
  const limitParamIndex = hasPatterns ? 3 : 2;
  const params: any[] = hasPatterns
    ? [patterns, businessKey || 'best-seller', limit]
    : [businessKey || 'best-seller', limit];
  const patternClause = hasPatterns
    ? `
      AND (
        LOWER(COALESCE(dp.segment, '')) LIKE ANY($1::text[])
        OR LOWER(COALESCE(dp.product_type, '')) LIKE ANY($1::text[])
      )
    `
    : '';

  const sql = `
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
      COALESCE(dp.base_price, 0)::numeric AS base_price,
      COALESCE(dp.original_price, NULL)::numeric AS original_price,
      COALESCE(dp.price_note, '') AS price_note,
      CASE
        WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
          OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
        THEN '/pdt.png'
        ELSE dp.image_url
      END AS image,
      COALESCE(dp.segment, dp.product_type, 'CCTV') AS segment,
      COALESCE(dp.description, '') AS product_description,
      COALESCE(dp.specifications, '') AS product_specifications,
      COALESCE(dp.manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) AS sold,
      $${businessParamIndex}::text AS business_name
    FROM dealer_products dp
    LEFT JOIN order_sales os ON os.product_id = dp.id
    LEFT JOIN inventory_sales inv ON inv.product_id = dp.id
    WHERE dp.is_active = true
    ${patternClause}
    ORDER BY sold DESC, dp.model_number ASC
    LIMIT $${limitParamIndex}
  `;
  return pool.query(sql, params);
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
    ALTER TABLE dealer_products
    ADD COLUMN IF NOT EXISTS price_note TEXT
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
}

export async function GET(request: NextRequest) {
  try {
    await ensureBestsellerTable();
    const pool = getPool();
    const grouped = request.nextUrl.searchParams.get('grouped') === 'true';
    const businessParam = request.nextUrl.searchParams.get('business');
    const businessFilter = businessParam ? normalizeBusinessKey(businessParam) : null;
    const fetchAll = request.nextUrl.searchParams.get('all') === 'true';
    const limitParam = parseInt(request.nextUrl.searchParams.get('limit') || '10', 10);
    const limit = fetchAll
      ? 500
      : Number.isFinite(limitParam)
        ? Math.min(Math.max(limitParam, 1), 20)
        : 10;

    if (grouped) {
      let groupedResult;

      try {
        groupedResult = await pool.query(
          `
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
            ),
            ranked AS (
              SELECT
                hb.business_name,
                dp.id,
                dp.model_number AS product_name,
                dp.company AS brand_name,
                COALESCE(dp.base_price, 0)::numeric AS base_price,
                COALESCE(dp.original_price, NULL)::numeric AS original_price,
                COALESCE(dp.price_note, '') AS price_note,
                CASE
                  WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
                    OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
                  THEN '/pdt.png'
                  ELSE dp.image_url
                END AS image,
                COALESCE(dp.segment, dp.product_type, 'CCTV') AS segment,
                COALESCE(dp.description, '') AS product_description,
                COALESCE(dp.specifications, '') AS product_specifications,
                COALESCE(dp.manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) AS sold,
                ROW_NUMBER() OVER (
                  PARTITION BY hb.business_name
                  ORDER BY COALESCE(dp.manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) DESC, hb.display_order ASC, dp.model_number ASC
                ) AS rn
              FROM homepage_bestseller_products hb
              INNER JOIN dealer_products dp ON dp.id = hb.product_id
              LEFT JOIN order_sales os ON os.product_id = dp.id
              LEFT JOIN inventory_sales inv ON inv.product_id = dp.id
              WHERE hb.is_active = true
                AND dp.is_active = true
                AND hb.business_name = ANY($1::text[])
            )
            SELECT *
            FROM ranked
            WHERE rn <= $2
            ORDER BY business_name ASC, sold DESC, product_name ASC
          `,
          [BUSINESS_SECTIONS.map((item) => item.key), limit]
        );
      } catch (error) {
        console.error('Bestseller grouped query failed, falling back to manual sold only:', error);
        groupedResult = await pool.query(
          `
            WITH ranked AS (
              SELECT
                hb.business_name,
                dp.id,
                dp.model_number AS product_name,
                dp.company AS brand_name,
                COALESCE(dp.base_price, 0)::numeric AS base_price,
                COALESCE(dp.original_price, NULL)::numeric AS original_price,
                COALESCE(dp.price_note, '') AS price_note,
                CASE
                  WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
                    OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
                  THEN '/pdt.png'
                  ELSE dp.image_url
                END AS image,
                COALESCE(dp.segment, dp.product_type, 'CCTV') AS segment,
                COALESCE(dp.description, '') AS product_description,
                COALESCE(dp.specifications, '') AS product_specifications,
                COALESCE(dp.manual_sold, 0) AS sold,
                ROW_NUMBER() OVER (
                  PARTITION BY hb.business_name
                  ORDER BY COALESCE(dp.manual_sold, 0) DESC, hb.display_order ASC, dp.model_number ASC
                ) AS rn
              FROM homepage_bestseller_products hb
              INNER JOIN dealer_products dp ON dp.id = hb.product_id
              WHERE hb.is_active = true
                AND dp.is_active = true
                AND hb.business_name = ANY($1::text[])
            )
            SELECT *
            FROM ranked
            WHERE rn <= $2
            ORDER BY business_name ASC, sold DESC, product_name ASC
          `,
          [BUSINESS_SECTIONS.map((item) => item.key), limit]
        );
      }

      const rowsByBusiness = new Map<string, any[]>();
      for (const section of BUSINESS_SECTIONS) {
        rowsByBusiness.set(section.key, []);
      }

      if (groupedResult.rows.length === 0) {
        for (const section of BUSINESS_SECTIONS) {
          const fallbackResult = await fetchFallbackProducts(pool, section.key, limit);
          rowsByBusiness.set(section.key, fallbackResult.rows);
        }
      } else {
        for (const row of groupedResult.rows) {
          const list = rowsByBusiness.get(String(row.business_name)) || [];
          list.push({
            id: row.id,
            product_name: row.product_name,
            brand_name: row.brand_name,
            base_price: row.base_price,
            original_price: row.original_price,
            price_note: row.price_note,
            image: row.image,
            segment: row.segment,
            product_description: row.product_description,
            product_specifications: row.product_specifications,
            sold: row.sold,
          });
          rowsByBusiness.set(String(row.business_name), list);
        }
      }

      return NextResponse.json({
        success: true,
        sections: BUSINESS_SECTIONS.map((section) => ({
          business_key: section.key,
          business_name: section.name,
          products: rowsByBusiness.get(section.key) || [],
        })),
      });
    }

    let result;

    try {
      result = await pool.query(
        `
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
            COALESCE(dp.base_price, 0)::numeric AS base_price,
            COALESCE(dp.original_price, NULL)::numeric AS original_price,
            COALESCE(dp.price_note, '') AS price_note,
            CASE
              WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
                OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
              THEN '/pdt.png'
              ELSE dp.image_url
            END AS image,
            COALESCE(dp.segment, dp.product_type, 'CCTV') AS segment,
            COALESCE(dp.description, '') AS product_description,
            COALESCE(dp.specifications, '') AS product_specifications,
            COALESCE(dp.manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) AS sold,
            hb.business_name
          FROM homepage_bestseller_products hb
          INNER JOIN dealer_products dp ON dp.id = hb.product_id
          LEFT JOIN order_sales os ON os.product_id = dp.id
          LEFT JOIN inventory_sales inv ON inv.product_id = dp.id
          WHERE hb.is_active = true
            AND dp.is_active = true
            AND ($2::text IS NULL OR hb.business_name = $2)
          ORDER BY sold DESC, hb.display_order ASC, dp.model_number ASC
          LIMIT $1
        `,
        [limit, businessFilter]
      );
    } catch (error) {
      console.error('Bestseller query failed, falling back to manual sold only:', error);
      result = await pool.query(
        `
          SELECT
            dp.id,
            dp.model_number AS product_name,
            dp.company AS brand_name,
            COALESCE(dp.base_price, 0)::numeric AS base_price,
            COALESCE(dp.original_price, NULL)::numeric AS original_price,
            COALESCE(dp.price_note, '') AS price_note,
            CASE
              WHEN NULLIF(BTRIM(COALESCE(dp.image_url, '')), '') IS NULL
                OR BTRIM(COALESCE(dp.image_url, '')) = '/placeholder.png'
              THEN '/pdt.png'
              ELSE dp.image_url
            END AS image,
            COALESCE(dp.segment, dp.product_type, 'CCTV') AS segment,
            COALESCE(dp.description, '') AS product_description,
            COALESCE(dp.specifications, '') AS product_specifications,
            COALESCE(dp.manual_sold, 0) AS sold,
            hb.business_name
          FROM homepage_bestseller_products hb
          INNER JOIN dealer_products dp ON dp.id = hb.product_id
          WHERE hb.is_active = true
            AND dp.is_active = true
            AND ($2::text IS NULL OR hb.business_name = $2)
          ORDER BY sold DESC, hb.display_order ASC, dp.model_number ASC
          LIMIT $1
        `,
        [limit, businessFilter]
      );
    }

    if (result.rows.length === 0) {
      const fallbackResult = await fetchFallbackProducts(pool, businessFilter, limit);
      return NextResponse.json({ success: true, products: fallbackResult.rows, business: businessFilter });
    }

    return NextResponse.json({ success: true, products: result.rows, business: businessFilter });
  } catch (error) {
    console.error('Error fetching bestseller products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bestseller products' },
      { status: 500 }
    );
  }
}
