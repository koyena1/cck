import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import * as XLSX from 'xlsx';

function normalizeProductType(productType: string) {
  const normalized = (productType || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'combo' || normalized === 'combo product' || normalized === 'combo products') {
    return 'Combo Product';
  }
  if (normalized === 'single' || normalized === 'single product' || normalized === 'single products') {
    return 'Single Product';
  }
  return String(productType).trim();
}

function getRowValue(row: any, keys: string[]) {
  const normalizedMap = new Map<string, any>();
  for (const key of Object.keys(row || {})) {
    normalizedMap.set(String(key).trim().toLowerCase(), row[key]);
  }

  for (const key of keys) {
    const value = normalizedMap.get(key.trim().toLowerCase());
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
}

function parseBooleanExcelValue(value: any, defaultValue: boolean) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 'active', 'in stock'].includes(normalized)) {
    return true;
  }
  if (['no', 'n', 'false', '0', 'inactive', 'out of stock'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function normalizeHeaderKey(value: any) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function pickBestProductSheet(workbook: XLSX.WorkBook) {
  const expectedHeaders = [
    'company',
    'segment',
    'model number',
    'modelnumber',
    'model',
    'product type',
    'producttype',
    'type',
  ];

  let bestSheetName = workbook.SheetNames[0];
  let bestScore = -1;

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    const firstRow = rows[0] || [];
    const headers = new Set(firstRow.map(normalizeHeaderKey));

    let score = 0;
    for (const h of expectedHeaders) {
      if (headers.has(normalizeHeaderKey(h))) score++;
    }

    const lowerName = sheetName.toLowerCase();
    if (lowerName.includes('product') || lowerName.includes('pricing') || lowerName.includes('data')) {
      score += 2;
    }
    if (lowerName.includes('instruction')) {
      score -= 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSheetName = sheetName;
    }
  }

  return bestSheetName;
}

// POST - Upload Excel file and process dealer product pricing
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string || 'admin';
    const dealerIdParam = formData.get('dealerId') as string | null;
    const dealerId = dealerIdParam ? parseInt(dealerIdParam, 10) : null;
    const useDealerOverride = dealerId !== null && !Number.isNaN(dealerId);

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Pick the most likely product data sheet by headers and sheet name hints.
    const sheetName = pickBestProductSheet(workbook);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data found in Excel file' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Create upload log
    const logQuery = `
      INSERT INTO dealer_pricing_upload_log (uploaded_by, file_name, total_records, upload_status)
      VALUES ($1, $2, $3, 'processing')
      RETURNING id
    `;
    const logResult = await pool.query(logQuery, [uploadedBy, file.name, data.length]);
    const uploadLogId = logResult.rows[0].id;

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      
      try {
        // Map Excel columns (handle different possible column names)
        const company = String(getRowValue(row, ['Company', 'company'])).trim();
        const segment = String(getRowValue(row, ['Segment', 'segment'])).trim();
        const modelNumber = String(getRowValue(row, ['Model Number', 'model_number', 'ModelNumber', 'Model No', 'Model', 'model'])).trim();
        const productTypeRaw = getRowValue(row, ['Product Type', 'product_type', 'ProductType', 'Type', 'type', 'Product type', 'product type']);
        const productType = normalizeProductType(String(productTypeRaw));
        const description = String(getRowValue(row, ['Description', 'description'])).trim();
        const specifications = String(getRowValue(row, ['Specifications', 'specifications'])).trim();
        const basePrice = parseFloat(String(getRowValue(row, ['Base Price', 'base_price', 'BasePrice', 'BasePrice(RS)', 'Base Price (RS)']) || 0));
        const purchasePercentage = parseFloat(String(getRowValue(row, ['Purchase %', 'purchase_percentage', 'PurchasePercentage', 'Purchase % (from Base)']) || 0));
        const salePercentage = parseFloat(String(getRowValue(row, ['Sale %', 'sale_percentage', 'SalePercentage', 'Sale % (from Purchase)']) || 0));
        const stockQuantity = parseInt(String(getRowValue(row, ['Stock Quantity', 'stock_quantity', 'StockQuantity']) || 0), 10);
        const inStock = parseBooleanExcelValue(getRowValue(row, ['In Stock', 'in_stock', 'InStock']), true);
        const isActive = parseBooleanExcelValue(getRowValue(row, ['Active', 'active', 'is_active', 'Is Active']), true);

        if (!company || !segment || !modelNumber || !productType) {
          errors.push(`Row ${i + 2}: Missing required fields (Company, Segment, Model Number, or Product Type)`);
          failCount++;
          continue;
        }

        // Check if product exists
        const existQuery = 'SELECT id, dealer_purchase_price, dealer_sale_price FROM dealer_products WHERE model_number = $1';
        const existResult = await pool.query(existQuery, [modelNumber]);

        if (existResult.rows.length > 0) {
          // Update existing product
          const existingProduct = existResult.rows[0];
          
          // Calculate new prices from base + percentage (for history logging)
          const newPurchasePrice = basePrice + (basePrice * purchasePercentage / 100);
          const newSalePrice = newPurchasePrice + (newPurchasePrice * salePercentage / 100);
          
          // Log price history
          await pool.query(`
            INSERT INTO dealer_product_price_history (
              product_id, old_purchase_price, new_purchase_price,
              old_sale_price, new_sale_price, changed_by, change_type
            ) VALUES ($1, $2, $3, $4, $5, $6, 'excel_upload')
          `, [
            existingProduct.id,
            existingProduct.dealer_purchase_price,
            newPurchasePrice,
            existingProduct.dealer_sale_price,
            newSalePrice,
            uploadedBy
          ]);

          if (useDealerOverride) {
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
                  $6,
                  $6
                )
                ON CONFLICT (dealer_id, product_id)
                DO UPDATE SET
                  base_price = EXCLUDED.base_price,
                  purchase_percentage = EXCLUDED.purchase_percentage,
                  sale_percentage = EXCLUDED.sale_percentage,
                  dealer_purchase_price = EXCLUDED.dealer_purchase_price,
                  dealer_sale_price = EXCLUDED.dealer_sale_price,
                  updated_by = EXCLUDED.updated_by,
                  updated_at = CURRENT_TIMESTAMP
              `,
              [dealerId, existingProduct.id, basePrice, purchasePercentage, salePercentage, uploadedBy]
            );
          } else {
            // Update global product (prices will be calculated by trigger)
            const updateQuery = `
              UPDATE dealer_products 
              SET company = $1, segment = $2, product_type = $3, description = $4,
                  specifications = $5, base_price = $6, purchase_percentage = $7,
                  sale_percentage = $8, stock_quantity = $9, in_stock = $10,
                  is_active = $11, updated_at = CURRENT_TIMESTAMP
              WHERE model_number = $12
            `;
            await pool.query(updateQuery, [
              company, segment, productType, description, specifications,
              basePrice, purchasePercentage, salePercentage,
              stockQuantity, inStock, isActive, modelNumber
            ]);
          }
        } else {
          // Insert new product (prices will be calculated by trigger)
          const insertQuery = `
            INSERT INTO dealer_products (
              company, segment, model_number, product_type, description,
              specifications, base_price, purchase_percentage, sale_percentage,
              stock_quantity, in_stock, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `;
          const insertResult = await pool.query(insertQuery, [
            company, segment, modelNumber, productType, description,
            specifications, basePrice, purchasePercentage, salePercentage,
            stockQuantity, inStock, isActive
          ]);

          if (useDealerOverride) {
            const productId = insertResult.rows[0].id;
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
                  $6,
                  $6
                )
              `,
              [dealerId, productId, basePrice, purchasePercentage, salePercentage, uploadedBy]
            );
          }
        }

        successCount++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failCount++;
      }
    }

    // Update upload log
    await pool.query(`
      UPDATE dealer_pricing_upload_log
      SET successful_records = $1, failed_records = $2, error_details = $3, upload_status = 'completed'
      WHERE id = $4
    `, [successCount, failCount, errors.join('\n'), uploadLogId]);

    return NextResponse.json({
      success: true,
      message: 'Excel file processed successfully',
      stats: {
        total: data.length,
        successful: successCount,
        failed: failCount,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error uploading Excel file:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process Excel file' },
      { status: 500 }
    );
  }
}
