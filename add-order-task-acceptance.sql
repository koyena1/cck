ALTER TABLE orders
ADD COLUMN IF NOT EXISTS task_accepted_by_portal VARCHAR(20),
ADD COLUMN IF NOT EXISTS task_accepted_by_name TEXT,
ADD COLUMN IF NOT EXISTS task_accepted_by_details JSONB,
ADD COLUMN IF NOT EXISTS task_accepted_at TIMESTAMP NULL;