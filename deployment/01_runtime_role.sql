-- Run as DB administrator AFTER the canonical schema, only on a new/approved venue DB.
-- psql prompts without echo; no password literal or SQL concatenation required.
CREATE ROLE pickleball_app LOGIN;
\password pickleball_app
GRANT CONNECT ON DATABASE pickleball TO pickleball_app;
GRANT USAGE ON SCHEMA public TO pickleball_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO pickleball_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pickleball_app;
GRANT EXECUTE ON FUNCTION expire_pending_schedule_entries() TO pickleball_app;
