-- Example: availability for every active court on November 3, 2026.
-- Change the date below. Requires optional demo seed or your own courts/hours.
-- Shows elapsed, blocked, occupied, pending and available slots.
-- Clear expired holds first so stale records do not appear available but remain blocked.
SELECT expire_pending_schedule_entries() AS expired_pending_count;

WITH config AS (
    SELECT DATE '2026-11-03' AS booking_date,
           v.timezone,
           v.slot_minutes
    FROM venue_settings AS v
    WHERE v.id = 1
),
open_day AS (
    SELECT c.booking_date, c.timezone, c.slot_minutes,
           oh.opens_at, oh.closes_at
    FROM config AS c
    JOIN operating_hours AS oh
      ON oh.day_of_week = EXTRACT(DOW FROM c.booking_date)::SMALLINT
    WHERE NOT oh.is_closed
),
local_slots AS (
    SELECT d.timezone, d.slot_minutes, series.slot_start_local
    FROM open_day AS d
    CROSS JOIN LATERAL generate_series(
        d.booking_date + d.opens_at,
        d.booking_date + d.closes_at - MAKE_INTERVAL(mins => d.slot_minutes),
        MAKE_INTERVAL(mins => d.slot_minutes)
    ) AS series(slot_start_local)
),
slot_times AS (
    SELECT slot_start_local,
           slot_start_local AT TIME ZONE timezone AS starts_at,
           (slot_start_local + MAKE_INTERVAL(mins => slot_minutes))
               AT TIME ZONE timezone AS ends_at
    FROM local_slots
)
SELECT cr.court_name,
       TO_CHAR(s.slot_start_local, 'HH12:MI AM') AS time_start,
       TO_CHAR(s.slot_start_local + (s.ends_at - s.starts_at), 'HH12:MI AM') AS time_end,
       CASE
          WHEN s.ends_at <= NOW() THEN 'ELAPSED'
          WHEN EXISTS (
              SELECT 1 FROM court_schedule_entries e
              WHERE e.court_id = cr.id AND e.status = 'BLOCKED'
                AND tstzrange(e.starts_at, e.ends_at, '[)')
                    && tstzrange(s.starts_at, s.ends_at, '[)')
          ) THEN 'BLOCKED'
          WHEN EXISTS (
              SELECT 1 FROM court_schedule_entries e
              WHERE e.court_id = cr.id AND e.status IN ('CONFIRMED', 'COMPLETED')
                AND tstzrange(e.starts_at, e.ends_at, '[)')
                    && tstzrange(s.starts_at, s.ends_at, '[)')
          ) THEN 'OCCUPIED'
          WHEN EXISTS (
              SELECT 1 FROM court_schedule_entries e
              WHERE e.court_id = cr.id AND e.status IN ('HELD', 'AWAITING_REVIEW')
                AND e.expires_at > NOW()
                AND tstzrange(e.starts_at, e.ends_at, '[)')
                    && tstzrange(s.starts_at, s.ends_at, '[)')
          ) THEN 'PENDING'
          ELSE 'AVAILABLE'
       END AS display_status
FROM slot_times s
CROSS JOIN courts cr
WHERE cr.is_active
ORDER BY s.slot_start_local, cr.display_order, cr.id;
