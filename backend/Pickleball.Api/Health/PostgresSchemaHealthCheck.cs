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
