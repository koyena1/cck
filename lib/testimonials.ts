import { getPool } from '@/lib/db';

export type TestimonialRow = {
  id: number;
  customer_name: string;
  location: string;
  testimonial_text: string;
  rating: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function ensureTestimonialsTable() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS homepage_testimonials (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      testimonial_text TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT ''
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS rating INTEGER NOT NULL DEFAULT 5
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    ALTER TABLE homepage_testimonials
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);

  await pool.query(`
    UPDATE homepage_testimonials
    SET rating = 5
    WHERE rating < 1 OR rating > 5
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_homepage_testimonials_active_order
    ON homepage_testimonials (is_active, display_order, created_at)
  `);
}

function mapTestimonialRow(row: any): TestimonialRow {
  return {
    id: Number(row.id),
    customer_name: String(row.customer_name || ''),
    location: String(row.location || ''),
    testimonial_text: String(row.testimonial_text || ''),
    rating: Number(row.rating) || 5,
    display_order: Number(row.display_order) || 0,
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getActiveTestimonials(limit?: number) {
  await ensureTestimonialsTable();
  const pool = getPool();

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 200) : null;

  const result = safeLimit
    ? await pool.query(
        `
          SELECT *
          FROM homepage_testimonials
          WHERE is_active = TRUE
          ORDER BY display_order ASC, created_at DESC
          LIMIT $1
        `,
        [safeLimit]
      )
    : await pool.query(`
        SELECT *
        FROM homepage_testimonials
        WHERE is_active = TRUE
        ORDER BY display_order ASC, created_at DESC
      `);

  return result.rows.map(mapTestimonialRow);
}

export async function getAllTestimonials() {
  await ensureTestimonialsTable();
  const pool = getPool();

  const result = await pool.query(`
    SELECT *
    FROM homepage_testimonials
    ORDER BY is_active DESC, display_order ASC, created_at DESC
  `);

  return result.rows.map(mapTestimonialRow);
}
