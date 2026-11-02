# API inventory — Phase 3

Phase 3 exposes management APIs but **no actual online booking or payment actions**. All admin mutations require a valid CSRF header and authentication/role authorization, except login which is anonymous but still requires CSRF.

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | /health | Public, process only |
| GET | /health/db | Public, nine tables and venue row |
| GET | /api/v1/system/status | Public |
| GET | /api/v1/venue | Public venue branding |
| GET | /api/v1/venue/hours | Public operating hours |
| GET | /api/v1/courts | Public active courts |
| GET | /api/v1/admin/auth/csrf | Public antiforgery issuance |
| POST | /api/v1/admin/auth/login | Public, CSRF + rate limited |
| POST | /api/v1/admin/auth/logout | Any staff, CSRF |
| POST | /api/v1/admin/auth/change-password | Any staff, CSRF |
| GET | /api/v1/admin/auth/me | Any staff |
| GET | /api/v1/admin/courts, /{id} | Any staff |
| POST | /api/v1/admin/courts | OWNER or MANAGER, CSRF |
| PUT | /api/v1/admin/courts/{id} | OWNER or MANAGER, CSRF |
| GET | /api/v1/admin/venue, /hours | Any staff |
| PUT | /api/v1/admin/venue | OWNER, CSRF |
| PUT | /api/v1/admin/venue/hours | OWNER or MANAGER, CSRF |
| GET | /api/v1/admin/staff | OWNER |
| POST | /api/v1/admin/staff | OWNER, CSRF |
| PATCH | /api/v1/admin/staff/{id}/active | OWNER, CSRF |
| POST | /api/v1/admin/staff/{id}/reset-password | OWNER, CSRF |

See [Phase 3 authentication](../phase-3-authentication.md) for owner creation, cookie use, request examples and CSRF handling.

Real-time availability, pricing rules engine, guest booking and payment operations are later phases.
