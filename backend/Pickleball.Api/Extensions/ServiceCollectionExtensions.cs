using Pickleball.Api.Services.Courts;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Payments;
using Pickleball.Api.Services.Operations;
using Pickleball.Api.Storage;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Availability;
using Pickleball.Api.Services.Pricing;
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
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IPricingService, PricingService>();
        services.AddSingleton<GuestBookingTokens>();
        services.AddScoped<IBookingService, BookingService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IOperationsService, OperationsService>();
        services.AddScoped<IProofStorage, LocalProofStorage>();
        return services;
    }
}
