import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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
const BESTSELLER_EXCEL_COLUMNS = [
  'Business Segment',
  'Show In Segment',
  'Display Order',
  'Product ID',
  'Product Name',
  'Brand Name',
  'Segment',
  'Base Price',
  'Original Price',
  'Price Note',
  'Product Description',
  'Product Specifications',
  'Sold',
  'Image URL',
] as const;
const EXCEL_CELL_TEXT_LIMIT = 32767;

function parseNumericInput(value: unknown) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBusinessKey(value: unknown) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'best-seller';

  const slug = raw.replace(/[\s_]+/g, '-');
  if (BUSINESS_KEYS.has(slug)) return slug;

  const byName = BUSINESS_SECTIONS.find((section) => section.name.toLowerCase() === raw);
  return byName?.key || 'best-seller';
}

function getBusinessLabel(businessKey: string) {
  return BUSINESS_SECTIONS.find((section) => section.key === businessKey)?.name || 'Best Seller';
}

function normalizeHeader(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getCellValue(row: Record<string, unknown>, header: string) {
  const expected = normalizeHeader(header);
  const foundKey = Object.keys(row).find((key) => normalizeHeader(key) === expected);
  return foundKey ? row[foundKey] : undefined;
}

function getStringInput(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeExcelText(value: unknown) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncateExcelText(value: unknown) {
  const text = normalizeExcelText(value);
  if (text.length <= EXCEL_CELL_TEXT_LIMIT) return text;

  const suffix = ' [truncated]';
  return `${text.slice(0, EXCEL_CELL_TEXT_LIMIT - suffix.length)}${suffix}`;
}

function getExcelImageUrl(value: unknown) {
  const text = normalizeExcelText(value);
  return text.length <= EXCEL_CELL_TEXT_LIMIT ? text : '';
}

function parseOptionalNumericInput(value: unknown) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  return parseNumericInput(value);
}

function parseIntegerInput(value: unknown, fallback: number) {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  const parsed = Math.trunc(parseNumericInput(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanInput(value: unknown, defaultValue = true) {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;

  const normalized = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'selected', 'show', 'active'].includes(normalized)) return true;
  if (['no', 'n', 'false', '0', 'hidden', 'inactive'].includes(normalized)) return false;
  return defaultValue;
}

function readProductRowsFromWorkbook(workbook: XLSX.WorkBook) {
  const requiredHeaders = ['Product Name', 'Brand Name'];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
    const headerIndex = matrix.findIndex((row) => {
      const headers = new Set(row.map(normalizeHeader));
      return requiredHeaders.every((header) => headers.has(normalizeHeader(header)));
    });

    if (headerIndex === -1) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      range: headerIndex,
    });

    return {
      rows,
      sheetName,
      headerRowNumber: headerIndex + 1,
    };
  }

  return {
    rows: [] as Record<string, unknown>[],
    sheetName: '',
    headerRowNumber: 1,
  };
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

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_homepage_bestseller_business
    ON homepage_bestseller_products (business_name)
  `);
}

async function fetchAdminBestsellerProducts(pool: ReturnType<typeof getPool>, businessKey: string) {
  return pool.query(`
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
      COALESCE(dp.price_note, '') AS price_note,
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
}

function buildBestsellerExcelResponse(products: any[], businessKey: string) {
  const businessLabel = getBusinessLabel(businessKey);
  const headers = [...BESTSELLER_EXCEL_COLUMNS];
  const rows = products.length > 0
    ? products.map((product) => [
        businessLabel,
        product.selected ? 'Yes' : 'No',
        Number(product.display_order) === 9999 ? '' : Number(product.display_order) || '',
        product.id,
        truncateExcelText(product.product_name),
        truncateExcelText(product.brand_name),
        truncateExcelText(product.segment || businessLabel),
        Number(product.base_price) || 0,
        product.original_price !== null && product.original_price !== undefined ? Number(product.original_price) || 0 : '',
        truncateExcelText(product.price_note),
        truncateExcelText(product.product_description),
        truncateExcelText(product.product_specifications),
        Number(product.sold) || 0,
        getExcelImageUrl(product.image),
      ])
    : [[businessLabel, 'Yes', 1, '', `${businessLabel} Product`, 'Brand Name', businessLabel, 0, '', '', '', '', 0, '']];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(header.length + 4, 18) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${businessLabel} Products`.slice(0, 31));

  const instructions = XLSX.utils.aoa_to_sheet([
    ['Bestseller Excel Upload Notes'],
    ['Column', 'How to use'],
    ['Show In Segment', 'Use Yes/No to control whether the row appears in the selected segment.'],
    ['Display Order', 'Optional. Smaller numbers appear first after upload.'],
    ['Product ID', 'Keep existing IDs to update products. Leave blank to create or match by Product Name.'],
    ['Image URL', 'Leave blank to keep the existing product image. Very long uploaded image data is omitted from exports.'],
  ]);
  instructions['!cols'] = [{ wch: 24 }, { wch: 96 }];
  XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  const fileName = `bestseller-${businessKey}-products.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}

async function handleBestsellerExcelUpload(request: Request, pool: ReturnType<typeof getPool>) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const businessKey = normalizeBusinessKey(formData.get('business'));
  const businessLabel = getBusinessLabel(businessKey);

  if (!file) {
    return NextResponse.json({ success: false, error: 'No Excel file provided' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const { rows, sheetName, headerRowNumber } = readProductRowsFromWorkbook(workbook);

  if (rows.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required Excel columns: Product Name, Brand Name',
        expectedColumns: BESTSELLER_EXCEL_COLUMNS,
      },
      { status: 400 }
    );
  }

  const uploadedHeaders = new Set(Object.keys(rows[0]).map(normalizeHeader));
  const missingHeaders = ['Product Name', 'Brand Name'].filter((header) => !uploadedHeaders.has(normalizeHeader(header)));
  if (missingHeaders.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing required Excel columns: ${missingHeaders.join(', ')}`,
        expectedColumns: BESTSELLER_EXCEL_COLUMNS,
      },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  const seenProductNames = new Set<string>();
  const parsedRows = rows
    .map((row, index) => ({ row, rowNumber: headerRowNumber + index + 1 }))
    .filter(({ row }) => BESTSELLER_EXCEL_COLUMNS.some((header) => String(getCellValue(row, header) ?? '').trim() !== ''))
    .map(({ row, rowNumber }, index) => {
      const productIdRaw = getStringInput(getCellValue(row, 'Product ID'));
      const productId = productIdRaw && /^\d+$/.test(productIdRaw) ? Number(productIdRaw) : null;
      const productName = getStringInput(getCellValue(row, 'Product Name'));
      const brandName = getStringInput(getCellValue(row, 'Brand Name'));
      const segment = getStringInput(getCellValue(row, 'Segment')) || businessLabel;
      const imageUrl = getStringInput(getCellValue(row, 'Image URL'));
      const productNameKey = productName.toLowerCase();

      if (!productName) errors.push(`Row ${rowNumber}: Product Name is required`);
      if (!brandName) errors.push(`Row ${rowNumber}: Brand Name is required`);
      if (productNameKey && seenProductNames.has(productNameKey)) {
        errors.push(`Row ${rowNumber}: Duplicate product name "${productName}" in uploaded file`);
      }
      if (productNameKey) seenProductNames.add(productNameKey);

      return {
        rowNumber,
        productId,
        productName,
        brandName,
        segment,
        basePrice: parseNumericInput(getCellValue(row, 'Base Price')),
        originalPrice: parseOptionalNumericInput(getCellValue(row, 'Original Price')),
        priceNote: getStringInput(getCellValue(row, 'Price Note')) || null,
        description: getStringInput(getCellValue(row, 'Product Description')),
        specifications: getStringInput(getCellValue(row, 'Product Specifications')),
        sold: Math.max(0, Math.trunc(parseNumericInput(getCellValue(row, 'Sold')))),
        imageUrl: imageUrl || null,
        hasImageUrl: imageUrl.length > 0,
        showInSegment: parseBooleanInput(getCellValue(row, 'Show In Segment'), true),
        displayOrder: parseIntegerInput(getCellValue(row, 'Display Order'), index + 1),
      };
    });

  if (parsedRows.length === 0) {
    return NextResponse.json({ success: false, error: 'No product rows found in Excel file' }, { status: 400 });
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: 'Excel validation failed', errors }, { status: 400 });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let created = 0;
    let updated = 0;
    const selectedEntries: Array<{ productId: number; displayOrder: number }> = [];

    for (const row of parsedRows) {
      let productId = row.productId;

      if (productId) {
        const existingById = await client.query('SELECT id FROM dealer_products WHERE id = $1 LIMIT 1', [productId]);
        if (existingById.rows.length === 0) {
          productId = null;
        } else {
          const duplicate = await client.query(
            'SELECT id FROM dealer_products WHERE model_number = $1 AND id <> $2 LIMIT 1',
            [row.productName, productId]
          );
          if (duplicate.rows.length > 0) {
            throw new Error(`Row ${row.rowNumber}: Model number already exists: ${row.productName}`);
          }
        }
      }

      if (!productId) {
        const existingByName = await client.query('SELECT id FROM dealer_products WHERE model_number = $1 LIMIT 1', [row.productName]);
        productId = existingByName.rows[0]?.id || null;
      }

      if (productId) {
        await client.query(
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
              image_url = CASE WHEN $9 THEN $10 ELSE image_url END,
              price_note = $11
            WHERE id = $12
          `,
          [
            row.brandName,
            row.segment,
            row.productName,
            row.description,
            row.specifications,
            row.basePrice,
            row.originalPrice,
            row.sold,
            row.hasImageUrl,
            row.imageUrl,
            row.priceNote,
            productId,
          ]
        );
        updated += 1;
      } else {
        const createdProduct = await client.query(
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
              price_note,
              dealer_sale_price,
              in_stock,
              is_active,
              image_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $7, true, true, $11)
            RETURNING id
          `,
          [
            row.brandName,
            row.segment,
            row.productName,
            'bestseller',
            row.description,
            row.specifications,
            row.basePrice,
            row.originalPrice,
            row.sold,
            row.priceNote,
            row.imageUrl,
          ]
        );
        productId = createdProduct.rows[0]?.id;
        created += 1;
      }

      if (productId && row.showInSegment) {
        selectedEntries.push({ productId, displayOrder: row.displayOrder });
      }
    }

    await client.query('DELETE FROM homepage_bestseller_products WHERE business_name = $1', [businessKey]);

    const uniqueSelected = Array.from(
      selectedEntries
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .reduce((map, entry) => {
          if (!map.has(entry.productId)) map.set(entry.productId, entry);
          return map;
        }, new Map<number, { productId: number; displayOrder: number }>())
        .values()
    );

    for (let i = 0; i < uniqueSelected.length; i += 1) {
      await client.query(
        `
          INSERT INTO homepage_bestseller_products (business_name, product_id, display_order, is_active)
          VALUES ($1, $2, $3, true)
        `,
        [businessKey, uniqueSelected[i].productId, i + 1]
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      business: businessKey,
      sheet: sheetName,
      uploaded: parsedRows.length,
      created,
      updated,
      selectedCount: uniqueSelected.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading bestseller Excel:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload bestseller Excel' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET(request: Request) {
  try {
    await ensureBestsellerTable();
    const pool = getPool();
    const { searchParams } = new URL(request.url);
    const businessKey = normalizeBusinessKey(searchParams.get('business'));
    const action = searchParams.get('action');

    const result = await fetchAdminBestsellerProducts(pool, businessKey);

    if (action === 'excel-sample') {
      return buildBestsellerExcelResponse(result.rows, businessKey);
    }

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
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return handleBestsellerExcelUpload(request, pool);
    }

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
        price_note,
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
            price_note,
            dealer_sale_price,
            in_stock,
            is_active,
            image_url
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $7, true, true, $11)
          RETURNING id
        `,
        [
          normalizedCompany,
          normalizedSegment,
          normalizedModel,
          'bestseller',
          product_description || '',
          product_specifications || '',
          parseNumericInput(base_price),
          original_price !== undefined && original_price !== null && String(original_price) !== ''
            ? parseNumericInput(original_price)
            : null,
          parseNumericInput(sold),
          price_note ? String(price_note).trim() : null,
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
        price_note,
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
            image_url = $9,
            price_note = $10
          WHERE id = $11
        `,
        [
          normalizedCompany,
          normalizedSegment,
          normalizedModel,
          product_description || '',
          product_specifications || '',
          parseNumericInput(base_price),
          original_price !== undefined && original_price !== null && String(original_price) !== ''
            ? parseNumericInput(original_price)
            : null,
          parseNumericInput(sold),
          image_url ? String(image_url).trim() : null,
          price_note ? String(price_note).trim() : null,
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
