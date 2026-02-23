import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch all dealer products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');
    const segment = searchParams.get('segment');
    const productType = searchParams.get('productType');
    const active = searchParams.get('active');

    const pool = getPool();
    let query = 'SELECT * FROM dealer_products WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (company) {
      query += ` AND company = $${paramIndex}`;
      params.push(company);
      paramIndex++;
    }

    if (segment) {
      query += ` AND segment = $${paramIndex}`;
      params.push(segment);
      paramIndex++;
    }

    if (productType) {
      query += ` AND product_type = $${paramIndex}`;
      params.push(productType);
      paramIndex++;
    }

    if (active !== null && active !== undefined) {
      query += ` AND is_active = $${paramIndex}`;
      params.push(active === 'true');
      paramIndex++;
    }

    query += ' ORDER BY company, segment, model_number';

    const result = await pool.query(query, params);

    // Also get unique values for filters
    const companiesResult = await pool.query('SELECT DISTINCT company FROM dealer_products ORDER BY company');
    const segmentsResult = await pool.query('SELECT DISTINCT segment FROM dealer_products ORDER BY segment');
    const typesResult = await pool.query('SELECT DISTINCT product_type FROM dealer_products ORDER BY product_type');

    return NextResponse.json({
      success: true,
      products: result.rows,
      filters: {
        companies: companiesResult.rows.map(r => r.company),
        segments: segmentsResult.rows.map(r => r.segment),
        productTypes: typesResult.rows.map(r => r.product_type)
      }
    });
  } catch (error) {
    console.error('Error fetching dealer products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer products' },
      { status: 500 }
    );
  }
}

// POST - Create or update dealer product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
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
      is_active
    } = body;

    if (!company || !segment || !model_number || !product_type) {
      return NextResponse.json(
        { success: false, error: 'Company, segment, model number, and product type are required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if product exists
    const existQuery = 'SELECT id FROM dealer_products WHERE model_number = $1';
    const existResult = await pool.query(existQuery, [model_number]);

    let result;
    if (existResult.rows.length > 0) {
      // Update existing product
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
        company, segment, product_type, description, specifications,
        base_price, purchase_percentage || 0, sale_percentage || 0,
        stock_quantity, in_stock, is_active, model_number
      ]);
    } else {
      // Insert new product
      const insertQuery = `
        INSERT INTO dealer_products (
          company, segment, model_number, product_type, description,
          specifications, base_price, purchase_percentage, sale_percentage,
          stock_quantity, in_stock, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [
        company, segment, model_number, product_type, description,
        specifications, base_price, purchase_percentage || 0, sale_percentage || 0,
        stock_quantity, in_stock, is_active
      ]);
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error creating/updating dealer product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save dealer product' },
      { status: 500 }
    );
  }
}

// PUT - Bulk update pricing percentages
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { filterType, filterValue, percentage, priceType } = body;

    if (!filterType || !percentage || !priceType) {
      return NextResponse.json(
        { success: false, error: 'Filter type, percentage, and price type are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    let query = '';
    let params: any[] = [];

    // REPLACE existing percentage (not add to it)
    // New percentage is calculated fresh from base/purchase price every time
    // Prices will be recalculated automatically by database trigger
    
    if (priceType === 'both' || priceType === 'purchase') {
      const purchasePercentageUpdate = `purchase_percentage = ${percentage}`;
      
      if (filterType === 'all') {
        query = `UPDATE dealer_products SET ${purchasePercentageUpdate}`;
      } else if (filterType === 'company') {
        query = `UPDATE dealer_products SET ${purchasePercentageUpdate} WHERE company = $1`;
        params.push(filterValue);
      } else if (filterType === 'segment') {
        query = `UPDATE dealer_products SET ${purchasePercentageUpdate} WHERE segment = $1`;
        params.push(filterValue);
      } else if (filterType === 'product_type') {
        query = `UPDATE dealer_products SET ${purchasePercentageUpdate} WHERE product_type = $1`;
        params.push(filterValue);
      }

      await pool.query(query, params);
    }

    if (priceType === 'both' || priceType === 'sale') {
      const salePercentageUpdate = `sale_percentage = ${percentage}`;
      params = [];
      
      if (filterType === 'all') {
        query = `UPDATE dealer_products SET ${salePercentageUpdate}`;
      } else if (filterType === 'company') {
        query = `UPDATE dealer_products SET ${salePercentageUpdate} WHERE company = $1`;
        params.push(filterValue);
      } else if (filterType === 'segment') {
        query = `UPDATE dealer_products SET ${salePercentageUpdate} WHERE segment = $1`;
        params.push(filterValue);
      } else if (filterType === 'product_type') {
        query = `UPDATE dealer_products SET ${salePercentageUpdate} WHERE product_type = $1`;
        params.push(filterValue);
      }

      await pool.query(query, params);
    }

    return NextResponse.json({
      success: true,
      message: 'Pricing percentages updated successfully. Prices recalculated automatically.'
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update prices' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const query = 'DELETE FROM dealer_products WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
