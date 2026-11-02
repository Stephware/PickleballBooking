-- Read-only preflight for the SQL-first schema. Run in DBeaver or psql.
-- Nothing is created, altered or deleted. Exceptions mean schema drift.
DO $$
DECLARE
  table_count INTEGER;
  exclusion_count INTEGER;
  trigger_count INTEGER;
  expiry_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    AND table_name IN (
      'venue_settings', 'staff_users', 'courts', 'operating_hours',
      'pricing_rules', 'customers', 'court_schedule_entries',
      'bookings', 'payments');
  IF table_count <> 9 THEN
    RAISE EXCEPTION 'Expected 9 application tables; found %', table_count;
  END IF;

  SELECT COUNT(*) INTO exclusion_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace ns ON ns.oid = t.relnamespace
  WHERE ns.nspname = 'public' AND t.relname = 'court_schedule_entries'
    AND c.conname = 'ex_court_active_time_overlap' AND c.contype = 'x';
  IF exclusion_count <> 1 THEN
    RAISE EXCEPTION 'Required active-booking exclusion constraint missing';
  END IF;

  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger trg
  JOIN pg_class t ON t.oid = trg.tgrelid
  JOIN pg_namespace ns ON ns.oid = t.relnamespace
  WHERE ns.nspname = 'public' AND NOT trg.tgisinternal
    AND trg.tgname IN (
      'trg_venue_settings_updated', 'trg_staff_users_updated',
      'trg_courts_updated', 'trg_pricing_rules_updated',
      'trg_court_schedule_entries_updated', 'trg_bookings_updated',
      'trg_payments_updated');
  IF trigger_count <> 7 THEN
    RAISE EXCEPTION 'Expected 7 application updated_at triggers; found %', trigger_count;
  END IF;

  SELECT COUNT(*) INTO expiry_function_count
  FROM pg_proc p
  JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = 'public' AND p.proname = 'expire_pending_schedule_entries';
  IF expiry_function_count <> 1 THEN
    RAISE EXCEPTION 'Expiration transition function is missing';
  END IF;

  RAISE NOTICE 'PASS: all 9 tables, overlap exclusion, 7 triggers and expiry function are present';
END;
$$;
