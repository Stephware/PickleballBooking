-- Forward-only idempotent upgrade for an EXISTING Pickleball venue.
-- Back up PostgreSQL and private proofs; deploy before the new API release.
-- Existing HELD deadlines are unchanged; new HELD bookings get 10 minutes.
BEGIN;

ALTER TABLE court_schedule_entries DROP CONSTRAINT schedule_pending_has_expiry;
ALTER TABLE court_schedule_entries ADD CONSTRAINT schedule_pending_has_expiry CHECK (
    (status = 'HELD' AND expires_at IS NOT NULL)
    OR (status <> 'HELD' AND expires_at IS NULL)
) NOT VALID;

-- Preserve payment proofs and protected reservations still under review.
UPDATE court_schedule_entries SET expires_at = NULL WHERE status = 'AWAITING_REVIEW';
ALTER TABLE court_schedule_entries VALIDATE CONSTRAINT schedule_pending_has_expiry;

CREATE OR REPLACE FUNCTION expire_pending_schedule_entries()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE court_schedule_entries
       SET status = 'EXPIRED', expires_at = NULL
     WHERE status = 'HELD' AND expires_at <= NOW();
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

ALTER TABLE venue_settings ALTER COLUMN hold_minutes SET DEFAULT 10;
-- Update only old defaults, preserving intentional venue-specific overrides.
UPDATE venue_settings SET hold_minutes = 10 WHERE hold_minutes = 15;

DROP INDEX IF EXISTS ix_schedule_entries_expiry;
CREATE INDEX ix_schedule_entries_expiry ON court_schedule_entries(expires_at)
    WHERE status = 'HELD';

COMMIT;
