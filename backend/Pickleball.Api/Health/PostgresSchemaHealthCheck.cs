using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Pickleball.Api.Data;

namespace Pickleball.Api.Health;

/// <summary>Read-only checks: DB reachability, all nine schema tables, venue row.</summary>
public sealed class PostgresSchemaHealthCheck(IServiceProvider provider) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetService<PickleballDbContext>();
        if (db is null)
            return HealthCheckResult.Unhealthy("Database connection is not configured.");

        try
        {
            if (!await db.Database.CanConnectAsync(cancellationToken))
                return HealthCheckResult.Unhealthy("PostgreSQL is unreachable.");

            const string sql = """
                SELECT COUNT(*)::int AS "Value"
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                  AND table_name IN (
                    'venue_settings', 'staff_users', 'courts', 'operating_hours',
                    'pricing_rules', 'customers', 'court_schedule_entries',
                    'bookings', 'payments')
                """;
            var tables = await db.Database.SqlQueryRaw<int>(sql)
                .SingleAsync(cancellationToken);
            if (tables != 9)
                return HealthCheckResult.Unhealthy("Expected PostgreSQL tables are missing.");

            // Refuse a deployment whose existing database was not upgraded:
            // the legacy expiry worker would otherwise release submitted proofs.
            const string reviewPolicySql = """
                SELECT CASE WHEN pg_get_functiondef(
                    'public.expire_pending_schedule_entries()'::regprocedure
                ) LIKE '%WHERE status = ''HELD''%'
                AND EXISTS (
                    SELECT 1 FROM pg_constraint c
                    JOIN pg_class t ON t.oid = c.conrelid
                    WHERE t.relname = 'court_schedule_entries'
                      AND c.conname = 'schedule_pending_has_expiry'
                      AND pg_get_constraintdef(c.oid) NOT LIKE '%AWAITING_REVIEW%'
                )
                THEN 1 ELSE 0 END AS "Value"
                """;
            var policyCurrent = await db.Database.SqlQueryRaw<int>(reviewPolicySql)
                .SingleAsync(cancellationToken);
            if (policyCurrent != 1)
                return HealthCheckResult.Unhealthy(
                    "Payment review policy upgrade required. Apply the reviewed SQL patch.");

            // Use actual EF mapping; catches broken configuration/data.
            if (!await db.VenueSettings.AsNoTracking().AnyAsync(cancellationToken))
                return HealthCheckResult.Unhealthy("Venue configuration row is missing.");

            return HealthCheckResult.Healthy("PostgreSQL schema is reachable.");
        }
        catch (Exception)
        {
            // Never disclose a connection string or database server exception to callers.
            return HealthCheckResult.Unhealthy("PostgreSQL schema check failed.");
        }
    }
}
