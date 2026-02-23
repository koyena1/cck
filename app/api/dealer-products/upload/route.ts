import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import * as XLSX from 'xlsx';

// POST - Upload Excel file and process dealer product pricing
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = formData.get('uploadedBy') as string || 'admin';

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

    // Get the first sheet (assuming product data is in the first sheet or "Product Pricing Data" sheet)
    const sheetName = workbook.SheetNames.find(name => 
      name.includes('Product') || name.includes('Data') || name === workbook.SheetNames[0]
    ) || workbook.SheetNames[0];
    
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
        const company = row['Company'] || row['company'] || '';
        const segment = row['Segment'] || row['segment'] || '';
        const modelNumber = row['Model Number'] || row['model_number'] || row['ModelNumber'] || '';
        const productType = row['Product Type'] || row['product_type'] || row['ProductType'] || '';
        const description = row['Description'] || row['description'] || '';
        const specifications = row['Specifications'] || row['specifications'] || '';
        const basePrice = parseFloat(row['Base Price'] || row['base_price'] || row['BasePrice'] || 0);
        const purchasePercentage = parseFloat(row['Purchase %'] || row['purchase_percentage'] || row['PurchasePercentage'] || 0);
        const salePercentage = parseFloat(row['Sale %'] || row['sale_percentage'] || row['SalePercentage'] || 0);
        const stockQuantity = parseInt(row['Stock Quantity'] || row['stock_quantity'] || row['StockQuantity'] || 0);
        const inStock = (row['In Stock'] || row['in_stock'] || row['InStock'] || 'Yes').toLowerCase() === 'yes';
        const isActive = (row['Active'] || row['active'] || row['is_active'] || 'Yes').toLowerCase() === 'yes';

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
          const newSalePrice = basePrice + (basePrice * salePercentage / 100);
          
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

          // Update product (prices will be calculated by trigger)
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
        } else {
          // Insert new product (prices will be calculated by trigger)
          const insertQuery = `
            INSERT INTO dealer_products (
              company, segment, model_number, product_type, description,
              specifications, base_price, purchase_percentage, sale_percentage,
              stock_quantity, in_stock, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `;
          await pool.query(insertQuery, [
            company, segment, modelNumber, productType, description,
            specifications, basePrice, purchasePercentage, salePercentage,
            stockQuantity, inStock, isActive
          ]);
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
