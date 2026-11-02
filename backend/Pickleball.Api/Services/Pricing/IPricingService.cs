using Pickleball.Api.DTOs.Pricing;

namespace Pickleball.Api.Services.Pricing;

public interface IPricingService
{
    Task<IReadOnlyList<PricingRuleResponse>> ListAsync(CancellationToken ct);
    Task<PricingRuleResponse> CreateAsync(SavePricingRuleRequest input, CancellationToken ct);
    Task<PricingRuleResponse?> UpdateAsync(long id, SavePricingRuleRequest input, CancellationToken ct);
    Task<bool> SetActiveAsync(long id, bool active, CancellationToken ct);
}
