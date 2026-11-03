-- Disposable integration data only; never load into a regular venue database.
DO $$ BEGIN
    IF right(current_database(), 5) <> '_test' THEN
        RAISE EXCEPTION 'Synthetic seed requires a database ending in _test';
    END IF;
END $$;
UPDATE venue_settings SET venue_name='Phase 9 Test Venue',venue_slug='phase9-test-venue';
INSERT INTO courts(court_name,base_hourly_rate) VALUES ('Integration Court A',250),('Integration Court B',300),('Integration Court C',200);
INSERT INTO operating_hours(day_of_week,opens_at,closes_at)
SELECT day::smallint,'06:00'::time,'23:00'::time FROM generate_series(0,6) day;
