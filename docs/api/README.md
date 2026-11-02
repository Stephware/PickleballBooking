# API surface (Phase 1)

The backend currently provides only infrastructure endpoints; bookings are NOT live.

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/health` | Public | Process health, no database check |
| GET | `/api/v1/system/status` | Public | Non-sensitive service name/status/UTC time |

## Error conventions

Unexpected exceptions use HTTP 500 with RFC 9457-style Problem Details and a generic message. Do not expose stack traces to clients. Future endpoints should return appropriate 400, 401, 403, 404, 409, 422 and 429 responses as applicable.

## Planned future API groups

- `/api/v1/venue`
- `/api/v1/courts`
- `/api/v1/availability`
- `/api/v1/bookings`
- `/api/v1/admin/*`

These routes are **not yet implemented**. Update this page when endpoints are added.
