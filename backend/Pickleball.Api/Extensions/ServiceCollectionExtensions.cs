using Pickleball.Api.Services.Courts;
using Pickleball.Api.Services.System;
using Pickleball.Api.Services.Venue;

namespace Pickleball.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<ISystemStatusService, SystemStatusService>();
        services.AddScoped<ICourtService, CourtService>();
        services.AddScoped<IVenueService, VenueService>();
        return services;
    }
}
