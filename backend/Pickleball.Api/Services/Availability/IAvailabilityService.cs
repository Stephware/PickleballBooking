using Pickleball.Api.DTOs.Availability;

namespace Pickleball.Api.Services.Availability;

public interface IAvailabilityService
{
    Task<AvailabilityDayResponse> GetDayAsync(
        DateOnly date, long? courtId, CancellationToken ct);
    Task<PriceQuoteResponse?> GetQuoteAsync(
        DateOnly date, long courtId, TimeOnly start, CancellationToken ct);
}
