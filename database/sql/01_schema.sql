-- Pickleball venue database schema (PostgreSQL 17)
-- Designed for ONE independently branded venue per deployment/database.
-- Automatically runs once when Docker initializes an EMPTY database volume.
-- For later changes, use versioned EF Core migrations rather than rerunning this file.

BEGIN;

-- Required for a PostgreSQL exclusion constraint involving BIGINT and time ranges.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1. Venue configuration: one venue per database.
CREATE TABLE venue_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    venue_name VARCHAR(150) NOT NULL,
    venue_slug VARCHAR(100) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Manila',
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    logo_url TEXT,
    primary_color CHAR(7) NOT NULL DEFAULT '#16805D',
    secondary_color CHAR(7) NOT NULL DEFAULT '#F2F7F4',
    slot_minutes INTEGER NOT NULL DEFAULT 60 CHECK (slot_minutes IN (30, 60, 90, 120)),
    hold_minutes INTEGER NOT NULL DEFAULT 10 CHECK (hold_minutes BETWEEN 1 AND 120),
    review_timeout_hours INTEGER NOT NULL DEFAULT 4 CHECK (review_timeout_hours BETWEEN 1 AND 72),
    booking_advance_days INTEGER NOT NULL DEFAULT 30 CHECK (booking_advance_days BETWEEN 1 AND 365),
    minimum_notice_minutes INTEGER NOT NULL DEFAULT 30 CHECK (minimum_notice_minutes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT venue_settings_primary_color_hex CHECK (primary_color ~ '^#[0-9a-fA-F]{6}$'),
    CONSTRAINT venue_settings_secondary_color_hex CHECK (secondary_color ~ '^#[0-9a-fA-F]{6}$')
);

-- 2. Staff/owner accounts. Hash passwords in ASP.NET Core Identity; never use plaintext.
CREATE TABLE staff_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'STAFF'
        CHECK (role IN ('OWNER', 'MANAGER', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_staff_users_email_ci ON staff_users (LOWER(email));

-- 3. A venue can create any number of courts without changing the schema.
CREATE TABLE courts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    court_name VARCHAR(100) NOT NULL,
    description TEXT,
    base_hourly_rate NUMERIC(10, 2) NOT NULL CHECK (base_hourly_rate >= 0),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_courts_name_ci ON courts (LOWER(court_name));

-- 4. Regular venue-wide operating hours (0=Sunday, 1=Monday ... 6=Saturday).
-- Overnight hours are not covered in this first version; openings must end same day.
CREATE TABLE operating_hours (
    day_of_week SMALLINT PRIMARY KEY CHECK (day_of_week BETWEEN 0 AND 6),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    opens_at TIME,
    closes_at TIME,
    CONSTRAINT operating_hours_valid CHECK (
        (is_closed AND opens_at IS NULL AND closes_at IS NULL)
        OR (NOT is_closed AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND opens_at < closes_at)
    )
);

-- 5. Optional seasonal/peak/off-peak pricing rules.
-- NULL court_id = venue-wide; NULL day_of_week = any day.
-- The API resolves precedence: court-specific first, then higher priority, then newer ID.
CREATE TABLE pricing_rules (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    court_id BIGINT REFERENCES courts(id) ON DELETE CASCADE,
    rule_name VARCHAR(120) NOT NULL,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pricing_rule_valid_time CHECK (starts_at < ends_at)
);
CREATE INDEX ix_pricing_rules_lookup ON pricing_rules (court_id, day_of_week, is_active, priority DESC);

-- 6. Optional reusable customer directory. Guest booking details remain snapshotted in bookings.
CREATE TABLE customers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(32),
    email VARCHAR(254),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT customer_has_contact CHECK (
        NULLIF(BTRIM(COALESCE(phone, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(email, '')), '') IS NOT NULL
    )
);
CREATE INDEX ix_customers_phone ON customers (phone);
CREATE INDEX ix_customers_email ON customers (LOWER(email));

-- 7. SINGLE source of truth for court occupancy: bookings AND owner blocks.
-- A time range is half-open [start, end), so adjacent slots are permitted.
-- "ELAPSED" is a UI calculation using time, not a persisted booking status.
CREATE TABLE court_schedule_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    court_id BIGINT NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    entry_type VARCHAR(16) NOT NULL CHECK (entry_type IN ('BOOKING', 'BLOCK')),
    status VARCHAR(24) NOT NULL CHECK (status IN (
        'HELD', 'AWAITING_REVIEW', 'CONFIRMED', 'COMPLETED',
        'CANCELLED', 'EXPIRED', 'BLOCKED'
    )),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    block_reason TEXT,
    created_by_staff_id BIGINT REFERENCES staff_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT schedule_valid_range CHECK (starts_at < ends_at),
    CONSTRAINT schedule_valid_type_status CHECK (
        (entry_type = 'BOOKING' AND status IN (
            'HELD', 'AWAITING_REVIEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED'))
        OR (entry_type = 'BLOCK' AND status IN ('BLOCKED', 'CANCELLED'))
    ),
    CONSTRAINT schedule_pending_has_expiry CHECK (
        (status = 'HELD' AND expires_at IS NOT NULL)
        OR (status <> 'HELD' AND expires_at IS NULL)
    )
);

-- Protects against ALL overlapping active holds, confirmed bookings, and maintenance blocks.
-- IMPORTANT: expiry must be processed by the API/worker, since a stale HELD row
-- remains blocking until its status is changed to EXPIRED.
ALTER TABLE court_schedule_entries
    ADD CONSTRAINT ex_court_active_time_overlap
    EXCLUDE USING GIST (
        court_id WITH =,
        tstzrange(starts_at, ends_at, '[)') WITH &&
    ) WHERE (status IN (
        'HELD', 'AWAITING_REVIEW', 'CONFIRMED', 'COMPLETED', 'BLOCKED'
    ));
CREATE INDEX ix_schedule_entries_court_start ON court_schedule_entries (court_id, starts_at);
CREATE INDEX ix_schedule_entries_expiry ON court_schedule_entries (expires_at)
    WHERE status = 'HELD';

-- 8. Booking details (one court per booking). Booking status comes from schedule entry.
CREATE TABLE bookings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE
        DEFAULT ('PB-' || UPPER(LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 16))),
    schedule_entry_id BIGINT NOT NULL UNIQUE
        REFERENCES court_schedule_entries(id) ON DELETE RESTRICT,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    guest_name VARCHAR(150) NOT NULL,
    guest_phone VARCHAR(32),
    guest_email VARCHAR(254),
    notes TEXT,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    required_deposit NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (required_deposit >= 0),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bookings_contact_required CHECK (
        NULLIF(BTRIM(COALESCE(guest_phone, '')), '') IS NOT NULL
        OR NULLIF(BTRIM(COALESCE(guest_email, '')), '') IS NOT NULL
    ),
    CONSTRAINT bookings_deposit_valid CHECK (required_deposit <= total_amount)
);
CREATE INDEX ix_bookings_customer_id ON bookings (customer_id);
CREATE INDEX ix_bookings_guest_phone ON bookings (guest_phone);

-- 9. GCash / bank transfer / cash / gateway transaction records.
-- Store only a reference/proof path; do not store account credentials or card data.
CREATE TABLE payments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    payment_method VARCHAR(24) NOT NULL CHECK (payment_method IN (
        'GCASH', 'BANK_TRANSFER', 'CASH', 'PAYMENT_GATEWAY', 'OTHER'
    )),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(16) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED', 'REFUNDED')),
    transaction_reference VARCHAR(150),
    proof_storage_key TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by_staff_id BIGINT REFERENCES staff_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_payments_booking_id ON payments (booking_id);
CREATE INDEX ix_payments_status ON payments (status);

-- 10. Timestamp maintenance on editable entities.
CREATE FUNCTION set_record_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_venue_settings_updated BEFORE UPDATE ON venue_settings
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_staff_users_updated BEFORE UPDATE ON staff_users
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_courts_updated BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_pricing_rules_updated BEFORE UPDATE ON pricing_rules
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_court_schedule_entries_updated BEFORE UPDATE ON court_schedule_entries
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_bookings_updated BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION set_record_updated_at();

-- Expire only HELD reservations with no submitted proof. AWAITING_REVIEW is
-- reserved until manual staff approval, rejection, or explicit resolution.
-- Call at the beginning of an availability/booking transaction AND periodically
-- from a background worker. Treat expiration as an explicit status transition.
CREATE FUNCTION expire_pending_schedule_entries()
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
    affected INTEGER;
BEGIN
    UPDATE court_schedule_entries
       SET status = 'EXPIRED', expires_at = NULL
     WHERE status = 'HELD'
       AND expires_at <= NOW();
    GET DIAGNOSTICS affected = ROW_COUNT;
    RETURN affected;
END;
$$;

-- Starter settings: rename/update in the owner's admin UI later.
INSERT INTO venue_settings (id, venue_name, venue_slug)
VALUES (1, 'Sample Pickleball Venue', 'sample-pickleball-venue');

COMMIT;
