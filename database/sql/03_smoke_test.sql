-- DBeaver / psql smoke test for the database-level overlap constraint.
-- Runs in a transaction and rolls everything back; no persistent test bookings.
BEGIN;
DO $$
DECLARE
    test_court_id BIGINT;
    test_start TIMESTAMPTZ := DATE_TRUNC('hour', NOW()) + INTERVAL '1 day';
BEGIN
    INSERT INTO courts (court_name, base_hourly_rate)
    VALUES ('__temporary_overlap_test__', 100)
    RETURNING id INTO test_court_id;

    INSERT INTO court_schedule_entries
        (court_id, entry_type, status, starts_at, ends_at)
    VALUES
        (test_court_id, 'BOOKING', 'CONFIRMED', test_start, test_start + INTERVAL '1 hour');

    BEGIN
        INSERT INTO court_schedule_entries
            (court_id, entry_type, status, starts_at, ends_at)
        VALUES
            (test_court_id, 'BOOKING', 'CONFIRMED',
             test_start + INTERVAL '30 minutes', test_start + INTERVAL '90 minutes');
        RAISE EXCEPTION 'FAIL: Overlapping booking was allowed';
    EXCEPTION WHEN exclusion_violation THEN
        RAISE NOTICE 'PASS: Overlapping booking rejected';
    END;

    INSERT INTO court_schedule_entries
        (court_id, entry_type, status, starts_at, ends_at)
    VALUES
        (test_court_id, 'BOOKING', 'CONFIRMED',
         test_start + INTERVAL '1 hour', test_start + INTERVAL '2 hours');
    RAISE NOTICE 'PASS: Back-to-back bookings accepted';

    BEGIN
        INSERT INTO court_schedule_entries
            (court_id, entry_type, status, starts_at, ends_at)
        VALUES
            (test_court_id, 'BLOCK', 'BLOCKED',
             test_start + INTERVAL '45 minutes', test_start + INTERVAL '75 minutes');
        RAISE EXCEPTION 'FAIL: Maintenance block overlapped a booking';
    EXCEPTION WHEN exclusion_violation THEN
        RAISE NOTICE 'PASS: Maintenance/booking overlap rejected';
    END;
END;
$$;
ROLLBACK;
