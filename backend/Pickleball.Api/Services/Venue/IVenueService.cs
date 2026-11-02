using Pickleball.Api.DTOs.Venue;

namespace Pickleball.Api.Services.Venue;

public interface IVenueService
{
    Task<PublicVenueResponse?> GetPublicAsync(CancellationToken ct);
    Task<VenueSettingsResponse?> GetSettingsAsync(CancellationToken ct);
    Task<VenueSettingsResponse?> UpdateAsync(SaveVenueRequest input, CancellationToken ct);
    Task<IReadOnlyList<OperatingHourResponse>> GetHoursAsync(CancellationToken ct);
    Task<IReadOnlyList<OperatingHourResponse>> SaveHoursAsync(
        SaveOperatingHoursRequest request, CancellationToken ct);
}
