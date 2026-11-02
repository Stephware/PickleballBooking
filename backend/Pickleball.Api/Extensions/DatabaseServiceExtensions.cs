using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Health;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Bookings;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Pricing;
using Pickleball.Api.Repositories.Scheduling;
using Pickleball.Api.Repositories.Settings;

namespace Pickleball.Api.Extensions;

public static class DatabaseServiceExtensions
{
    public static IServiceCollection AddPickleballDatabase(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Pickleball");
        // Tests/process status work without credentials. /health/db explicitly
        // returns unhealthy until the connection string is configured.
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            services.AddDbContext<PickleballDbContext>(options =>
                options.UseNpgsql(connectionString));
        }

        services.AddScoped<IUnitOfWork, EfUnitOfWork>();
        services.AddScoped<IVenueRepository, VenueRepository>();
        services.AddScoped<ICourtRepository, CourtRepository>();
        services.AddScoped<IScheduleRepository, ScheduleRepository>();
        services.AddScoped<IBookingRepository, BookingRepository>();
        services.AddScoped<IPricingRuleRepository, PricingRuleRepository>();
        services.AddHealthChecks().AddCheck<PostgresSchemaHealthCheck>(
            "postgres", tags: ["database"]);
        return services;
    }

    public static IEndpointRouteBuilder MapDatabaseHealth(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/db", new HealthCheckOptions
        {
            Predicate = entry => entry.Tags.Contains("database")
        });
        return endpoints;
    }
}
