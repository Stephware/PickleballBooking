-- OPTIONAL demo data (run manually AFTER starting PostgreSQL).
-- Safe to rerun: it will not overwrite existing court names or operating hours.
BEGIN;

INSERT INTO courts (court_name, description, base_hourly_rate, display_order)
VALUES
    ('Court 1', 'Standard court', 250.00, 1),
    ('Court 2', 'Standard court', 250.00, 2),
    ('Court 3', 'Covered court', 300.00, 3)
ON CONFLICT DO NOTHING;

INSERT INTO operating_hours (day_of_week, is_closed, opens_at, closes_at)
SELECT day_number, FALSE, TIME '08:00', TIME '22:00'
FROM generate_series(0, 6) AS day_number
ON CONFLICT (day_of_week) DO NOTHING;

COMMIT;
