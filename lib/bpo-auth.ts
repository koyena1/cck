import { Pool } from 'pg';

export async function ensureBpoUsersTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bpo_users (
      bpo_user_id SERIAL PRIMARY KEY,
      bpo_unique_id VARCHAR(20),
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(160) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`CREATE SEQUENCE IF NOT EXISTS bpo_unique_id_seq START WITH 1`);

  await pool.query(`
    ALTER TABLE bpo_users
    ADD COLUMN IF NOT EXISTS bpo_unique_id VARCHAR(20)
  `);

  await pool.query(`
    WITH latest AS (
      SELECT COALESCE(
        (
          SELECT MAX(CAST(SUBSTRING(bpo_unique_id FROM '([0-9]+)$') AS INTEGER))
          FROM bpo_users
          WHERE bpo_unique_id ~ '^BPO[0-9]+$'
        ),
        0
      ) AS max_num
    )
    SELECT setval(
      'bpo_unique_id_seq',
      CASE WHEN max_num > 0 THEN max_num ELSE 1 END,
      max_num > 0
    )
    FROM latest
  `);

  await pool.query(`
    ALTER TABLE bpo_users
    ALTER COLUMN bpo_unique_id SET DEFAULT ('BPO' || LPAD(nextval('bpo_unique_id_seq')::TEXT, 3, '0'))
  `);

  await pool.query(`
    UPDATE bpo_users
    SET bpo_unique_id = ('BPO' || LPAD(nextval('bpo_unique_id_seq')::TEXT, 3, '0'))
    WHERE bpo_unique_id IS NULL OR TRIM(bpo_unique_id) = ''
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bpo_users_unique_id
    ON bpo_users(bpo_unique_id)
    WHERE bpo_unique_id IS NOT NULL
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_bpo_users_email ON bpo_users(LOWER(email))');
}

export async function ensureBpoProfilesTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bpo_profiles (
      profile_id SERIAL PRIMARY KEY,
      bpo_user_id INTEGER NOT NULL UNIQUE REFERENCES bpo_users(bpo_user_id) ON DELETE CASCADE,
      location TEXT,
      phone_number VARCHAR(30),
      designation VARCHAR(120),
      notes TEXT,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_bpo_profiles_user_id ON bpo_profiles(bpo_user_id)');
}

export async function ensureBpoCallsTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bpo_call_logs (
      call_id SERIAL PRIMARY KEY,
      bpo_user_id INTEGER NOT NULL REFERENCES bpo_users(bpo_user_id) ON DELETE CASCADE,
      customer_name VARCHAR(160) NOT NULL,
      customer_phone VARCHAR(30) NOT NULL,
      call_status VARCHAR(30) NOT NULL DEFAULT 'connected',
      call_notes TEXT,
      follow_up_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_bpo_call_logs_user_id ON bpo_call_logs(bpo_user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_bpo_call_logs_created_at ON bpo_call_logs(created_at DESC)');
}
