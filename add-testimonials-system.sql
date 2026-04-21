-- Add testimonials table for website testimonials page and admin management

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
);

CREATE INDEX IF NOT EXISTS idx_homepage_testimonials_active_order
ON homepage_testimonials (is_active, display_order, created_at);
