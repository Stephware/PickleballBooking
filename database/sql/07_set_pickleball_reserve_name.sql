-- Opt-in one-time identity correction for an EXISTING Pickleball Reserve database.
-- Run only on the verified Pickleball Reserve venue, after a backup.
-- Changes the venue's display name only. Stable slugs and booking references
-- are intentionally not rewritten. No data deletion and no schema change.
BEGIN;

DO $$
DECLARE
    current_name text;
    current_slug text;
BEGIN
    SELECT venue_name, venue_slug INTO current_name, current_slug
    FROM venue_settings WHERE id = 1 FOR UPDATE;

    IF current_name IS NULL THEN
        RAISE EXCEPTION 'Venue settings row missing; refusing identity update';
    END IF;

    -- Never rename another tenant because it shares our codebase.
    IF current_name <> 'Pickleball Reserve'
       AND (current_name NOT IN ('Sample Pickleball Venue', 'Pickleball Venue', 'Pickleball')
            OR current_slug NOT IN ('sample-pickleball-venue', 'pickleball-reserve')) THEN
        RAISE EXCEPTION 'Venue identity does not match the bundled Reserve starter; review this deployment manually';
    END IF;

    UPDATE venue_settings SET venue_name = 'Pickleball Reserve'
    WHERE id = 1 AND venue_name <> 'Pickleball Reserve';
END;
$$;

COMMIT;
