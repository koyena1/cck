-- Normalizes district naming across all public text/varchar columns.
-- Replaces: East Medinipur / East Midnapore / Purba Midnapore -> Purba Medinipur

DO $$
DECLARE
  col RECORD;
  updated_rows BIGINT;
  total_updates BIGINT := 0;
BEGIN
  FOR col IN
    SELECT c.table_schema, c.table_name, c.column_name
    FROM information_schema.columns c
    INNER JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND c.data_type IN ('character varying', 'text', 'character')
  LOOP
    EXECUTE format(
      'UPDATE %I.%I
       SET %I = REGEXP_REPLACE(
         REGEXP_REPLACE(
           REGEXP_REPLACE(%I, ''(?i)\\meast\\s+medinipur\\M'', ''Purba Medinipur'', ''g''),
           ''(?i)\\meast\\s+midnapore\\M'', ''Purba Medinipur'', ''g''
         ),
         ''(?i)\\mpurba\\s+midnapore\\M'', ''Purba Medinipur'', ''g''
       )
       WHERE %I ~* ''\\m(east\\s+medinipur|east\\s+midnapore|purba\\s+midnapore)\\M''',
      col.table_schema,
      col.table_name,
      col.column_name,
      col.column_name,
      col.column_name
    );

    GET DIAGNOSTICS updated_rows = ROW_COUNT;
    total_updates := total_updates + updated_rows;
  END LOOP;

  RAISE NOTICE 'Total updated rows across all tables: %', total_updates;
END
$$;

-- Explicit safety updates for known district columns used in portal flows.
DO $blk$
BEGIN
  IF to_regclass('public.pincode_master') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE pincode_master
      SET district = 'Purba Medinipur'
      WHERE district ~* '^(east\s+medinipur|east\s+midnapore|purba\s+midnapore)$'
    $sql$;
  END IF;

  IF to_regclass('public.support_tickets') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE support_tickets
      SET district = 'Purba Medinipur'
      WHERE district ~* '^(east\s+medinipur|east\s+midnapore|purba\s+midnapore)$'
    $sql$;
  END IF;

  IF to_regclass('public.district_managers') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE district_managers
      SET district = 'Purba Medinipur'
      WHERE district ~* '^(east\s+medinipur|east\s+midnapore|purba\s+midnapore)$'
    $sql$;
  END IF;

  IF to_regclass('public.dealers') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE dealers
      SET district = 'Purba Medinipur'
      WHERE district ~* '^(east\s+medinipur|east\s+midnapore|purba\s+midnapore)$'
    $sql$;
  END IF;

  IF to_regclass('public.portal_notifications') IS NOT NULL THEN
    EXECUTE $sql$
      UPDATE portal_notifications
      SET recipient_key = 'Purba Medinipur'
      WHERE recipient_key ~* '^(east\s+medinipur|east\s+midnapore|purba\s+midnapore)$'
    $sql$;
  END IF;
END
$blk$;

-- Optional verification query after running migration:
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND data_type IN ('character varying','text','character');
-- Then search manually in your DB for old values if needed.
