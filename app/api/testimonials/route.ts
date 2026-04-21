import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getActiveTestimonials } from '@/lib/testimonials';
import { ensureTestimonialsTable } from '@/lib/testimonials';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : undefined;
    const testimonials = await getActiveTestimonials(parsedLimit);

    return NextResponse.json({
      success: true,
      testimonials,
    });
  } catch (error) {
    console.error('Failed to fetch testimonials:', error);
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

    if (!customer_name || !testimonial_text) {
      return NextResponse.json(
        { success: false, error: 'Name and review message are required' },
        { status: 400 }
      );
    }

    if (customer_name.length > 120 || location.length > 120 || testimonial_text.length > 1200) {
      return NextResponse.json(
        { success: false, error: 'Input is too long. Please shorten your review.' },
        { status: 400 }
      );
    }

    await pool.query(
      `
        INSERT INTO homepage_testimonials (
          customer_name,
          location,
          testimonial_text,
          rating,
          display_order,
          is_active
        )
        VALUES ($1, $2, $3, 5, 9999, FALSE)
      `,
      [customer_name, location, testimonial_text]
    );

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully and is pending admin approval.',
    });
  } catch (error) {
    console.error('Failed to submit testimonial:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    );
  }
}
