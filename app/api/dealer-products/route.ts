import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

type FilterType = 'all' | 'company' | 'segment' | 'product_type';

function normalizeProductType(productType: string) {
  const normalized = (productType || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'combo' || normalized === 'combo product' || normalized === 'combo products') {
    return 'Combo Product';
  }
  if (normalized === 'single' || normalized === 'single product' || normalized === 'single products') {
    return 'Single Product';
  }
  return productType.trim();
}

function buildProductScopeClause(
  filterType: FilterType,
  filterValue: string | null,
  startParamIndex: number
) {
  if (filterType === 'all') {
    return { whereSql: '1=1', params: [] as any[] };
  }

  if (!filterValue) {
    throw new Error('Filter value is required for selected filter type');
  }

  if (filterType === 'company') {
    return { whereSql: `company = $${startParamIndex}`, params: [filterValue] };
  }

  if (filterType === 'segment') {
    return { whereSql: `segment = $${startParamIndex}`, params: [filterValue] };
  }

  if (filterType === 'product_type') {
    return { whereSql: `product_type = $${startParamIndex}`, params: [filterValue] };
  }

  throw new Error('Invalid filter type');
}

// GET - Fetch all dealer products (global or dealer-specific effective pricing)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const segment = searchParams.get('segment');
    const productType = searchParams.get('productType');
    const active = searchParams.get('active');
    const dealerIdParam = searchParams.get('dealerId');
    const dealerId = dealerIdParam ? parseInt(dealerIdParam, 10) : null;

    const pool = getPool();
    const overridesTableCheck = await pool.query(
      "SELECT to_regclass('public.dealer_product_pricing_overrides') IS NOT NULL AS exists"
    );
    const hasPricingOverrides = overridesTableCheck.rows[0]?.exists === true;
    const productCodeColumnCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_products' AND column_name = 'product_code') AS exists"
    );
    const hasProductCode = productCodeColumnCheck.rows[0]?.exists === true;
    const productCodeSelect = hasProductCode
      ? "COALESCE(dp.product_code, 'PIC' || LPAD(dp.id::text, 3, '0')) AS product_code"
      : "('PIC' || LPAD(dp.id::text, 3, '0')) AS product_code";
    const params: any[] = [];
    let paramIndex = 1;

    let query = `
      SELECT
        dp.id,
        ${productCodeSelect},
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        dp.specifications,
        dp.base_price,
        dp.purchase_percentage,
        dp.sale_percentage,
        dp.dealer_purchase_price,
        dp.dealer_sale_price,
        dp.stock_quantity,
        dp.in_stock,
        dp.is_active,
        dp.created_at,
        dp.updated_at
      FROM dealer_products dp
      WHERE 1=1
    `;

    if (company) {
      query += ` AND dp.company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    if (segment) {
      query += ` AND dp.segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }

    if (productType) {
      query += ` AND dp.product_type = $${paramIndex}`;
      params.push(productType);
      paramIndex++;
    }

    if (active !== null && active !== undefined) {
      query += ` AND dp.is_active = $${paramIndex}`;
      params.push(active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY dp.company, dp.segment, dp.model_number';

    const baseProducts = await pool.query(query, params);

    let products = baseProducts.rows;

    if (dealerId !== null && !Number.isNaN(dealerId) && hasPricingOverrides) {
      const productIds = products.map((p) => p.id);
      if (productIds.length > 0) {
        const overridesResult = await pool.query(
          `
            SELECT product_id, base_price, purchase_percentage, sale_percentage,
                   dealer_purchase_price, dealer_sale_price
            FROM dealer_product_pricing_overrides
            WHERE dealer_id = $1 AND product_id = ANY($2::int[])
          `,
          [dealerId, productIds]
        );

        const overrideByProductId = new Map<number, any>();
        for (const row of overridesResult.rows) {
          overrideByProductId.set(row.product_id, row);
        }

        products = products.map((p) => {
          const o = overrideByProductId.get(p.id);
          if (!o) return p;
          return {
            ...p,
            base_price: o.base_price,
            purchase_percentage: o.purchase_percentage,
            sale_percentage: o.sale_percentage,
            dealer_purchase_price: o.dealer_purchase_price,
            dealer_sale_price: o.dealer_sale_price,
          };
        });
      }
    }

    const companiesResult = await pool.query('SELECT DISTINCT company FROM dealer_products ORDER BY company');
    const segmentsResult = await pool.query('SELECT DISTINCT segment FROM dealer_products ORDER BY segment');
    const typesResult = await pool.query('SELECT DISTINCT product_type FROM dealer_products ORDER BY product_type');
    const productTypes = Array.from(
      new Set([
        ...typesResult.rows.map((r) => r.product_type),
        'Single Product',
        'Combo Product',
      ])
    ).sort((a, b) => String(a).localeCompare(String(b)));

    return NextResponse.json({
      success: true,
      products,
      filters: {
        companies: companiesResult.rows.map((r) => r.company),
        segments: segmentsResult.rows.map((r) => r.segment),
        productTypes,
      },
    });
  } catch (error) {
    console.error('Error fetching dealer products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer products' },
      { status: 500 }
    );
  }
}

// POST - Create/update global product OR create/update dealer-specific override
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      dealerId,
      company,
      segment,
      model_number,
      product_type,
      description,
      specifications,
      base_price,
      purchase_percentage,
      sale_percentage,
      stock_quantity,
      in_stock,
      is_active,
    } = body;

    const normalizedProductType = normalizeProductType(String(product_type || ''));

    if (!company || !segment || !model_number || !normalizedProductType) {
      return NextResponse.json(
        { success: false, error: 'Company, segment, model number, and product type are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const productCodeColumnCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_products' AND column_name = 'product_code') AS exists"
    );
    const hasProductCode = productCodeColumnCheck.rows[0]?.exists === true;
    const productCodeSelect = hasProductCode
      ? "COALESCE(dp.product_code, 'PIC' || LPAD(dp.id::text, 3, '0')) AS product_code"
      : "('PIC' || LPAD(dp.id::text, 3, '0')) AS product_code";

    const numericDealerId = dealerId ? parseInt(String(dealerId), 10) : null;
    const hasDealerOverride = numericDealerId !== null && !Number.isNaN(numericDealerId);

    if (hasDealerOverride) {
      await pool.query('BEGIN');
      try {
        let productId: number | null = id ? parseInt(String(id), 10) : null;

        if (!productId || Number.isNaN(productId)) {
          const existingByModel = await pool.query(
            'SELECT id FROM dealer_products WHERE model_number = $1 LIMIT 1',
            [model_number]
          );
          if (existingByModel.rows.length > 0) {
            productId = existingByModel.rows[0].id;
          }
        }

        if (!productId || Number.isNaN(productId)) {
          const insertProduct = await pool.query(
            `
              INSERT INTO dealer_products (
                company, segment, model_number, product_type, description,
                specifications, base_price, purchase_percentage, sale_percentage,
                stock_quantity, in_stock, is_active
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              RETURNING id
            `,
            [
              company,
              segment,
              model_number,
              normalizedProductType,
              description,
              specifications,
              base_price,
              purchase_percentage || 0,
              sale_percentage || 0,
              stock_quantity,
              in_stock,
              is_active,
            ]
          );
          productId = insertProduct.rows[0].id;
        }

        await pool.query(
          `
            INSERT INTO dealer_product_pricing_overrides (
              dealer_id,
              product_id,
              base_price,
              purchase_percentage,
              sale_percentage,
              dealer_purchase_price,
              dealer_sale_price,
              created_by,
              updated_by
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              ROUND(($3 + ($3 * $4 / 100.0))::numeric, 2),
              ROUND((($3 + ($3 * $4 / 100.0)) * (1 + $5 / 100.0))::numeric, 2),
              'admin',
              'admin'
            )
            ON CONFLICT (dealer_id, product_id)
            DO UPDATE SET
              base_price = EXCLUDED.base_price,
              purchase_percentage = EXCLUDED.purchase_percentage,
              sale_percentage = EXCLUDED.sale_percentage,
              dealer_purchase_price = EXCLUDED.dealer_purchase_price,
              dealer_sale_price = EXCLUDED.dealer_sale_price,
              updated_by = 'admin',
              updated_at = CURRENT_TIMESTAMP
          `,
          [
            numericDealerId,
            productId,
            Number(base_price),
            Number(purchase_percentage || 0),
            Number(sale_percentage || 0),
          ]
        );

        const effectiveProduct = await pool.query(
          `
            SELECT
              dp.id,
              ${productCodeSelect},
              dp.company,
              dp.segment,
              dp.model_number,
              dp.product_type,
              dp.description,
              dp.specifications,
              COALESCE(dpo.base_price, dp.base_price) AS base_price,
              COALESCE(dpo.purchase_percentage, dp.purchase_percentage) AS purchase_percentage,
              COALESCE(dpo.sale_percentage, dp.sale_percentage) AS sale_percentage,
              COALESCE(dpo.dealer_purchase_price, dp.dealer_purchase_price) AS dealer_purchase_price,
              COALESCE(dpo.dealer_sale_price, dp.dealer_sale_price) AS dealer_sale_price,
              dp.stock_quantity,
              dp.in_stock,
              dp.is_active,
              dp.created_at,
              dp.updated_at
            FROM dealer_products dp
            LEFT JOIN dealer_product_pricing_overrides dpo
              ON dpo.product_id = dp.id AND dpo.dealer_id = $1
            WHERE dp.id = $2
            LIMIT 1
          `,
          [numericDealerId, productId]
        );

        await pool.query('COMMIT');

        return NextResponse.json({
          success: true,
          product: effectiveProduct.rows[0],
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    const existQuery = 'SELECT id FROM dealer_products WHERE model_number = $1';
    const existResult = await pool.query(existQuery, [model_number]);

    let result;
    if (existResult.rows.length > 0) {
      const updateQuery = `
        UPDATE dealer_products
        SET company = $1, segment = $2, product_type = $3, description = $4,
            specifications = $5, base_price = $6, purchase_percentage = $7,
            sale_percentage = $8, stock_quantity = $9, in_stock = $10,
            is_active = $11, updated_at = CURRENT_TIMESTAMP
        WHERE model_number = $12
        RETURNING *
      `;
      result = await pool.query(updateQuery, [
        company,
        segment,
        normalizedProductType,
        description,
        specifications,
        base_price,
        purchase_percentage || 0,
        sale_percentage || 0,
        stock_quantity,
        in_stock,
        is_active,
        model_number,
      ]);
    } else {
      const insertQuery = `
        INSERT INTO dealer_products (
          company, segment, model_number, product_type, description,
          specifications, base_price, purchase_percentage, sale_percentage,
          stock_quantity, in_stock, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [
        company,
        segment,
        model_number,
        normalizedProductType,
        description,
        specifications,
        base_price,
        purchase_percentage || 0,
        sale_percentage || 0,
        stock_quantity,
        in_stock,
        is_active,
      ]);
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating/updating dealer product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save dealer product' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update pricing percentages globally or for selected dealer only
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { filterType, filterValue, percentage, priceType, dealerId } = body;

    if (!filterType || percentage === undefined || percentage === null || !priceType) {
      return NextResponse.json(
        { success: false, error: 'Filter type, percentage, and price type are required' },
        { status: 400 }
      );
    }

    if (!['all', 'company', 'segment', 'product_type'].includes(filterType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filter type' },
        { status: 400 }
      );
    }

    if (!['both', 'purchase', 'sale'].includes(priceType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid price type' },
        { status: 400 }
      );
    }

    const pct = Number(percentage);
    if (Number.isNaN(pct)) {
      return NextResponse.json(
        { success: false, error: 'Invalid percentage value' },
        { status: 400 }
      );
    }

    const pool = getPool();

    const numericDealerId = dealerId ? parseInt(String(dealerId), 10) : null;
    const hasDealerOverride = numericDealerId !== null && !Number.isNaN(numericDealerId);

    if (hasDealerOverride) {
      const scope = buildProductScopeClause(filterType, filterValue || null, 3);
      const shouldUpdatePurchase = priceType === 'both' || priceType === 'purchase';
      const shouldUpdateSale = priceType === 'both' || priceType === 'sale';

      const dealerParams = [numericDealerId, pct, ...scope.params, shouldUpdatePurchase, shouldUpdateSale];

      await pool.query(
        `
          WITH selected_products AS (
            SELECT id, base_price, purchase_percentage, sale_percentage
            FROM dealer_products
            WHERE ${scope.whereSql}
          ),
          effective_values AS (
            SELECT
              sp.id AS product_id,
              COALESCE(dpo.base_price, sp.base_price) AS base_price,
              CASE
                WHEN $${3 + scope.params.length} THEN $2
                ELSE COALESCE(dpo.purchase_percentage, sp.purchase_percentage)
              END AS purchase_percentage,
              CASE
                WHEN $${4 + scope.params.length} THEN $2
                ELSE COALESCE(dpo.sale_percentage, sp.sale_percentage)
              END AS sale_percentage
            FROM selected_products sp
            LEFT JOIN dealer_product_pricing_overrides dpo
              ON dpo.product_id = sp.id
             AND dpo.dealer_id = $1
          )
          INSERT INTO dealer_product_pricing_overrides (
            dealer_id,
            product_id,
            base_price,
            purchase_percentage,
            sale_percentage,
            dealer_purchase_price,
            dealer_sale_price,
            created_by,
            updated_by
          )
          SELECT
            $1,
            ev.product_id,
            ev.base_price,
            ev.purchase_percentage,
            ev.sale_percentage,
            ROUND((ev.base_price + (ev.base_price * ev.purchase_percentage / 100.0))::numeric, 2),
            ROUND(((ev.base_price + (ev.base_price * ev.purchase_percentage / 100.0)) * (1 + ev.sale_percentage / 100.0))::numeric, 2),
            'admin',
            'admin'
          FROM effective_values ev
          ON CONFLICT (dealer_id, product_id)
          DO UPDATE SET
            base_price = EXCLUDED.base_price,
            purchase_percentage = EXCLUDED.purchase_percentage,
            sale_percentage = EXCLUDED.sale_percentage,
            dealer_purchase_price = EXCLUDED.dealer_purchase_price,
            dealer_sale_price = EXCLUDED.dealer_sale_price,
            updated_by = 'admin',
            updated_at = CURRENT_TIMESTAMP
        `,
        dealerParams
      );

      return NextResponse.json({
        success: true,
        message: 'Dealer-specific pricing percentages updated successfully.',
      });
    }

    const scope = buildProductScopeClause(filterType, filterValue || null, 2);

    if (priceType === 'both' || priceType === 'purchase') {
      await pool.query(
        `UPDATE dealer_products SET purchase_percentage = $1 WHERE ${scope.whereSql}`,
        [pct, ...scope.params]
      );
    }

    if (priceType === 'both' || priceType === 'sale') {
      await pool.query(
        `UPDATE dealer_products SET sale_percentage = $1 WHERE ${scope.whereSql}`,
        [pct, ...scope.params]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing percentages updated successfully. Prices recalculated automatically.',
    });
  } catch (error: any) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update prices' },
      { status: 500 }
    );
  }
}

// DELETE - Delete global product or only dealer-specific override
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dealerIdParam = searchParams.get('dealerId');
    const dealerId = dealerIdParam ? parseInt(dealerIdParam, 10) : null;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    if (dealerId !== null && !Number.isNaN(dealerId)) {
      const result = await pool.query(
        `
          DELETE FROM dealer_product_pricing_overrides
          WHERE dealer_id = $1 AND product_id = $2
          RETURNING *
        `,
        [dealerId, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Dealer-specific pricing override not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Dealer-specific pricing override removed successfully',
      });
    }

    const result = await pool.query('DELETE FROM dealer_products WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
