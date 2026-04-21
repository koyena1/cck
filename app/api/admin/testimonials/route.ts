import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureTestimonialsTable, getAllTestimonials } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toPositiveInt(value: unknown, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
}

function normalizeRating(value: unknown) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.floor(rating)));
}

export async function GET() {
  try {
    const testimonials = await getAllTestimonials();
    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error('Failed to fetch admin testimonials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTestimonialsTable();
    const pool = getPool();
    const body = await request.json();

    const customer_name = String(body?.customer_name || '').trim();
    const location = String(body?.location || '').trim();
    const testimonial_text = String(body?.testimonial_text || '').trim();
    const rating = normalizeRating(body?.rating);
    const display_order = toPositiveInt(body?.display_order, 0);
    const is_active = body?.is_active !== false;

    if (!customer_name || !testimonial_text) {
      return NextResponse.json(
        { success: false, error: 'Customer name and testimonial are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO homepage_testimonials (
          customer_name,
          location,
          testimonial_text,
          rating,
          display_order,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [customer_name, location, testimonial_text, rating, display_order, is_active]
    );

    return NextResponse.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Failed to create testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureTestimonialsTable();
    const pool = getPool();
    const body = await request.json();

    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid testimonial id is required' },
        { status: 400 }
      );
    }

    const customer_name = String(body?.customer_name || '').trim();
    const location = String(body?.location || '').trim();
    const testimonial_text = String(body?.testimonial_text || '').trim();
    const rating = normalizeRating(body?.rating);
    const display_order = toPositiveInt(body?.display_order, 0);
    const is_active = body?.is_active !== false;

    if (!customer_name || !testimonial_text) {
      return NextResponse.json(
        { success: false, error: 'Customer name and testimonial are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        UPDATE homepage_testimonials
        SET customer_name = $1,
            location = $2,
            testimonial_text = $3,
            rating = $4,
            display_order = $5,
            is_active = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `,
      [customer_name, location, testimonial_text, rating, display_order, is_active, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Failed to update testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await ensureTestimonialsTable();
    const pool = getPool();
    const body = await request.json();

    const id = Number(body?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid testimonial id is required' },
        { status: 400 }
      );
    }

    const is_active = body?.is_active === true;

    const result = await pool.query(
      `
        UPDATE homepage_testimonials
        SET is_active = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Failed to toggle testimonial status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update testimonial status' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureTestimonialsTable();
    const pool = getPool();
    const idParam = request.nextUrl.searchParams.get('id');
    const id = Number(idParam);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid testimonial id is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM homepage_testimonials WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}
