using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Settings;

public interface IVenueRepository
{
    Task<VenueSettings?> GetAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<OperatingHour>> GetHoursAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PricingRule>> GetActivePricingRulesAsync(
        CancellationToken cancellationToken = default);
}
