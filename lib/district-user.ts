import { Pool } from 'pg';

export async function ensureDistrictUserUniqueIdSetup(pool: Pool) {
  await pool.query(`
    ALTER TABLE district_users
    ADD COLUMN IF NOT EXISTS district_unique_id VARCHAR(20)
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION generate_district_unique_id(district_name TEXT)
    RETURNS VARCHAR AS $$
    DECLARE
      prefix TEXT;
      next_num INTEGER;
    BEGIN
      prefix := UPPER(LEFT(REGEXP_REPLACE(COALESCE(district_name, ''), '[^A-Za-z]', '', 'g') || 'XXX', 3));

      PERFORM pg_advisory_xact_lock(hashtext(prefix));

      SELECT COALESCE(MAX(CAST(SUBSTRING(district_unique_id FROM '([0-9]+)$') AS INTEGER)), 0) + 1
      INTO next_num
      FROM district_users
      WHERE district_unique_id LIKE prefix || '%';

      RETURN prefix || LPAD(next_num::TEXT, 3, '0');
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query(`
    CREATE OR REPLACE FUNCTION set_district_unique_id_trigger()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.district_unique_id IS NULL OR TRIM(NEW.district_unique_id) = '' THEN
        NEW.district_unique_id := generate_district_unique_id(NEW.district);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await pool.query(`
    DROP TRIGGER IF EXISTS trigger_set_district_unique_id ON district_users
  `);

  await pool.query(`
    CREATE TRIGGER trigger_set_district_unique_id
    BEFORE INSERT ON district_users
    FOR EACH ROW
    EXECUTE FUNCTION set_district_unique_id_trigger()
  `);

  await pool.query(`
    WITH prepared AS (
      SELECT
        district_user_id,
        UPPER(LEFT(REGEXP_REPLACE(COALESCE(district, ''), '[^A-Za-z]', '', 'g') || 'XXX', 3)) AS prefix
      FROM district_users
      WHERE district_unique_id IS NULL OR TRIM(district_unique_id) = ''
    ),
    max_existing AS (
      SELECT
        UPPER(LEFT(REGEXP_REPLACE(COALESCE(district, ''), '[^A-Za-z]', '', 'g') || 'XXX', 3)) AS prefix,
        COALESCE(MAX(CAST(SUBSTRING(district_unique_id FROM '([0-9]+)$') AS INTEGER)), 0) AS max_num
      FROM district_users
      WHERE district_unique_id IS NOT NULL AND TRIM(district_unique_id) <> ''
      GROUP BY 1
    ),
    ranked AS (
      SELECT
        p.district_user_id,
        p.prefix,
        COALESCE(m.max_num, 0) AS base_num,
        ROW_NUMBER() OVER (PARTITION BY p.prefix ORDER BY p.district_user_id) AS rn
      FROM prepared p
      LEFT JOIN max_existing m ON m.prefix = p.prefix
    )
    UPDATE district_users du
    SET district_unique_id = ranked.prefix || LPAD((ranked.base_num + ranked.rn)::TEXT, 3, '0')
    FROM ranked
    WHERE du.district_user_id = ranked.district_user_id
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_district_users_unique_id
    ON district_users(district_unique_id)
    WHERE district_unique_id IS NOT NULL
  `);
}
