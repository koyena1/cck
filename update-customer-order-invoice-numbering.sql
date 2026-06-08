-- Customer order and invoice numbering update
-- Order format after dealer assignment: DealerID-DDMMYYYY-Sequence
-- Example: 101-08062026-050
-- Invoice format: PR-FiscalYear-Sequence, e.g. PR-2627-0001

CREATE TABLE IF NOT EXISTS order_daily_sequence (
    seq_date  DATE PRIMARY KEY,
    seq_count INTEGER DEFAULT 0
);

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    order_seq INTEGER;
BEGIN
    INSERT INTO order_daily_sequence (seq_date, seq_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (seq_date) DO UPDATE
        SET seq_count = order_daily_sequence.seq_count + 1
    RETURNING seq_count INTO order_seq;

    NEW.order_number := 'NA-' || TO_CHAR(CURRENT_DATE, 'DDMMYYYY') || '-' || LPAD(order_seq::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_generate_order_number'
    ) THEN
        CREATE TRIGGER trg_generate_order_number
        BEFORE INSERT ON orders
        FOR EACH ROW
        WHEN (NEW.order_number IS NULL)
        EXECUTE FUNCTION generate_order_number();
    END IF;
END;
$$;

INSERT INTO order_daily_sequence (seq_date, seq_count)
SELECT order_date, MAX(serial)
FROM (
    SELECT
        TO_DATE(SUBSTRING(order_number FROM '^[^-]+-([0-9]{8})-[0-9]+$'), 'DDMMYYYY') AS order_date,
        (SUBSTRING(order_number FROM '^[^-]+-[0-9]{8}-([0-9]+)$'))::INTEGER AS serial
    FROM orders
    WHERE order_number ~ '^[^-]+-[0-9]{8}-[0-9]+$'

    UNION ALL

    SELECT
        TO_DATE(SUBSTRING(order_number FROM '^PR-([0-9]{8})-[0-9]+'), 'DDMMYYYY') AS order_date,
        (SUBSTRING(order_number FROM '^PR-[0-9]{8}-([0-9]+)'))::INTEGER AS serial
    FROM orders
    WHERE order_number ~ '^PR-[0-9]{8}-[0-9]+'
) existing_numbers
WHERE order_date IS NOT NULL
GROUP BY order_date
ON CONFLICT (seq_date) DO UPDATE
    SET seq_count = GREATEST(order_daily_sequence.seq_count, EXCLUDED.seq_count);

CREATE TABLE IF NOT EXISTS customer_invoice_numbers (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
    fiscal_year VARCHAR(4) NOT NULL,
    serial INTEGER NOT NULL,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_invoice_numbers_year_serial
ON customer_invoice_numbers(fiscal_year, serial);
