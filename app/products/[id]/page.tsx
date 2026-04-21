import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPool } from '@/lib/db';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = 'force-dynamic';

function parseSpecifications(specifications: string): string[] {
  if (!specifications) return [];

  try {
    const parsed = JSON.parse(specifications);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, value]) => `${key}: ${String(value)}`);
    }
  } catch {
    // Keep plain text behavior when value is not JSON.
  }

  return specifications
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound();
  }

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

  const result = await pool.query(
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
        id,
        company AS brand_name,
        segment,
        model_number AS product_name,
        description AS product_description,
        specifications AS product_specifications,
        COALESCE(base_price, 0)::numeric AS base_price,
        COALESCE(original_price, NULL)::numeric AS original_price,
        COALESCE(manual_sold, 0) + COALESCE(os.sold_qty, 0) + COALESCE(inv.sold_qty, 0) AS sold,
        CASE
          WHEN NULLIF(BTRIM(COALESCE(image_url, '')), '') IS NULL
            OR BTRIM(COALESCE(image_url, '')) = '/placeholder.png'
          THEN '/pdt.png'
          ELSE image_url
        END AS image_url,
        COALESCE(is_active, true) AS is_active
      FROM dealer_products
      LEFT JOIN order_sales os ON os.product_id = dealer_products.id
      LEFT JOIN inventory_sales inv ON inv.product_id = dealer_products.id
      WHERE id = $1
      LIMIT 1
    `,
    [numericId]
  );

  const product = result.rows[0];

  if (!product || product.is_active === false) {
    notFound();
  }

  const specificationList = parseSpecifications(product.product_specifications || '');

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-[#e63946] hover:underline">
            Back to Homepage
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="relative h-80 md:h-115 rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
            <img
              src={product.image_url || '/pdt.png'}
              alt={product.model_number || 'Product'}
              className="h-full w-full object-contain p-4"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#e63946] mb-2">{product.segment || 'CCTV'}</p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{product.product_name}</h1>
            <p className="text-sm text-slate-500 mt-2">Brand Name: {product.brand_name || 'N/A'}</p>

            <div className="mt-6 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-black text-slate-900">RS {Number(product.base_price || 0).toLocaleString()}</p>
              {product.original_price !== null && (
                <p className="text-lg text-slate-500 line-through">RS {Number(product.original_price || 0).toLocaleString()}</p>
              )}
            </div>

            <div className="mt-4 text-sm font-semibold text-slate-700">
              Sold: {Number(product.sold || 0).toLocaleString()}
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Product Details</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {product.product_description || 'No description available for this product yet.'}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2">Specifications</h2>
              {specificationList.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {specificationList.map((spec, index) => (
                    <li key={`${spec}-${index}`}>{spec}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600">Specifications are not available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
