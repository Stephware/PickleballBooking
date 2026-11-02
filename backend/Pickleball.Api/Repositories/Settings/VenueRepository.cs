using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Settings;

public sealed class VenueRepository(PickleballDbContext db) : IVenueRepository
{
    public Task<VenueSettings?> GetAsync(CancellationToken cancellationToken = default) =>
        db.VenueSettings.SingleOrDefaultAsync(v => v.Id == 1, cancellationToken);

    public async Task<IReadOnlyList<OperatingHour>> GetHoursAsync(
        CancellationToken cancellationToken = default) =>
        await db.OperatingHours.AsNoTracking()
            .OrderBy(h => h.DayOfWeek).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PricingRule>> GetActivePricingRulesAsync(
        CancellationToken cancellationToken = default) =>
        await db.PricingRules.AsNoTracking().Where(r => r.IsActive)
            .OrderByDescending(r => r.Priority).ThenByDescending(r => r.Id)
            .ToListAsync(cancellationToken);
}
