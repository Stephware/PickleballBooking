using Pickleball.Api.Services.System;

namespace Pickleball.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<ISystemStatusService, SystemStatusService>();
        return services;
    }
}
