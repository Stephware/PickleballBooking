using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.DTOs.Pricing;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Pricing;

namespace Pickleball.Api.Services.Pricing;

public sealed class PricingService(
    IPricingRuleRepository rules, ICourtRepository courts, IUnitOfWork unit)
    : IPricingService
{
    public async Task<IReadOnlyList<PricingRuleResponse>> ListAsync(CancellationToken ct) =>
        (await rules.ListAsync(ct)).Select(Map).ToArray();

    public async Task<PricingRuleResponse> CreateAsync(
        SavePricingRuleRequest input, CancellationToken ct)
    {
        await ValidateAsync(input, ct);
        var rule = new PricingRule();
        Apply(rule, input);
        rules.Add(rule);
        await SaveAsync(ct);
        return Map(rule);
    }

    public async Task<PricingRuleResponse?> UpdateAsync(
        long id, SavePricingRuleRequest input, CancellationToken ct)
    {
        await ValidateAsync(input, ct);
        var rule = await rules.FindAsync(id, ct);
        if (rule is null) return null;
        Apply(rule, input);
        await SaveAsync(ct);
        return Map(rule);
    }

    public async Task<bool> SetActiveAsync(long id, bool active, CancellationToken ct)
    {
        var rule = await rules.FindAsync(id, ct);
        if (rule is null) return false;
        rule.IsActive = active;
        await SaveAsync(ct);
        return true;
    }

    private async Task ValidateAsync(SavePricingRuleRequest input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.RuleName))
            throw new ArgumentException("Rule name is required.");
        if (input.DayOfWeek is < 0 or > 6 || input.StartsAt >= input.EndsAt)
            throw new ArgumentException("Rules need a valid weekday and same-day time window.");
        if (input.HourlyRate < 0m || input.HourlyRate > 99999999.99m)
            throw new ArgumentException("Hourly rate is outside the allowed range.");
        if (input.CourtId.HasValue &&
            await courts.FindAsync(input.CourtId.Value, ct) is null)
            throw new ArgumentException("Selected court does not exist.");
    }

    private async Task SaveAsync(CancellationToken ct)
    {
        try { await unit.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (
            ex.InnerException is PostgresException { SqlState: "23503" })
        {
            throw new InvalidOperationException("Referenced court no longer exists.");
        }
    }

    private static void Apply(PricingRule r, SavePricingRuleRequest input)
    {
        r.CourtId = input.CourtId;
        r.RuleName = input.RuleName.Trim();
        r.DayOfWeek = input.DayOfWeek;
        r.StartsAt = input.StartsAt;
        r.EndsAt = input.EndsAt;
        r.HourlyRate = input.HourlyRate;
        r.Priority = input.Priority;
        r.IsActive = input.IsActive;
    }

    private static PricingRuleResponse Map(PricingRule r) =>
        new(r.Id, r.CourtId, r.RuleName, r.DayOfWeek,
            r.StartsAt, r.EndsAt, r.HourlyRate, r.Priority, r.IsActive);
}
