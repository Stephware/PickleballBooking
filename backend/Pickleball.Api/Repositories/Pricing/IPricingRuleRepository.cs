using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Pricing;

public interface IPricingRuleRepository
{
    Task<IReadOnlyList<PricingRule>> ListAsync(CancellationToken ct);
    Task<PricingRule?> FindAsync(long id, CancellationToken ct);
    void Add(PricingRule rule);
}
