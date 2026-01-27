// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET() {
    try {
        const pool = getPool();
        const result = await pool.query(`
            SELECT product_id, model_name, description, retail_price, wholesale_price, image_url 
            FROM products
        `);
        return NextResponse.json(result.rows);
    } catch (err) {
        console.error('Database error:', err);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}