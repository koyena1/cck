-- ============================================================
-- Migration: Dealer-Prefixed Order Number Format
-- New format: [DealerUniqueID]-PR-[DDMMYYYY]-[Sequence]
-- Example:    003-PR-05032026-001
-- On reassignment: only the DealerUniqueID prefix changes.
--                  PR, date, and sequence stay identical.
-- ============================================================

-- 1. Atomic daily sequence table (race-condition safe)
CREATE TABLE IF NOT EXISTS order_daily_sequence (
    seq_date  DATE    PRIMARY KEY,
    seq_count INTEGER DEFAULT 0
);

-- 2. Replace the trigger function
--    Trigger generates the BASE part: PR-DDMMYYYY-SEQ
--    The DealerUniqueID prefix is prepended at allocation time by the API.
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    order_date TEXT;
    order_seq  INTEGER;
BEGIN
    -- DDMMYYYY format  (e.g. 05032026)
    order_date := TO_CHAR(CURRENT_DATE, 'DDMMYYYY');

    -- Atomically increment today's counter
    INSERT INTO order_daily_sequence (seq_date, seq_count)
    VALUES (CURRENT_DATE, 1)
    ON CONFLICT (seq_date) DO UPDATE
        SET seq_count = order_daily_sequence.seq_count + 1
    RETURNING seq_count INTO order_seq;

    -- Base order number — dealer prefix prepended at allocation
    NEW.order_number := 'PR-' || order_date || '-' || LPAD(order_seq::TEXT, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Seed the daily-sequence table from any existing orders that already use
--    the new PR-DDMMYYYY-SEQ format (safe to run multiple times)
INSERT INTO order_daily_sequence (seq_date, seq_count)
SELECT
    TO_DATE(SUBSTRING(order_number FROM 4 FOR 8), 'DDMMYYYY') AS seq_date,
    COUNT(*) AS seq_count
FROM orders
WHERE order_number ~ '^(([A-Z0-9]+)-)?PR-[0-9]{8}-[0-9]{3}$'
GROUP BY 1
ON CONFLICT (seq_date) DO UPDATE
    SET seq_count = GREATEST(order_daily_sequence.seq_count, EXCLUDED.seq_count);
