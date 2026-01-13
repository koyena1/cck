// app/api/products/route.ts
import { NextResponse } from 'next/server';
import sql from 'mssql';

const config = { /* Your MSSQL Config */ };

export async function GET() {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query(`
            SELECT ProductID, ModelName, Description, RetailPrice, WholesalePrice, ImageURL 
            FROM Products
        `);
        return NextResponse.json(result.recordset);
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}