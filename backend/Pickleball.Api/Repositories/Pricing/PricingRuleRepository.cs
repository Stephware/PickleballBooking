using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Pricing;

public sealed class PricingRuleRepository(PickleballDbContext db) : IPricingRuleRepository
{
    public async Task<IReadOnlyList<PricingRule>> ListAsync(CancellationToken ct) =>
        await db.PricingRules.AsNoTracking()
            .OrderBy(r => r.CourtId).ThenBy(r => r.DayOfWeek)
            .ThenBy(r => r.StartsAt).ThenByDescending(r => r.Priority)
            .ThenByDescending(r => r.Id).ToListAsync(ct);

    public Task<PricingRule?> FindAsync(long id, CancellationToken ct) =>
        db.PricingRules.SingleOrDefaultAsync(r => r.Id == id, ct);

    public void Add(PricingRule rule) => db.PricingRules.Add(rule);
}
