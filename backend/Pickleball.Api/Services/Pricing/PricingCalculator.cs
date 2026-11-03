using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Services.Pricing;

/// <summary>
/// Pure server-side pricing. For every interval between rule boundaries the
/// winning rule is: court-specific > venue-wide, priority DESC, ID DESC.
/// Partial slot overlaps are prorated by minutes (not the frontend).
/// </summary>
public static class PricingCalculator
{
    public static decimal Calculate(
        Court court, DateOnly date, TimeOnly start, TimeOnly end,
        IEnumerable<PricingRule> rules) =>
        RoundTotal(CalculateUnrounded(court, date, start, end, rules));

    internal static decimal RoundTotal(decimal total) =>
        decimal.Round(total, 2, MidpointRounding.AwayFromZero);

    internal static decimal CalculateUnrounded(
        Court court, DateOnly date, TimeOnly start, TimeOnly end,
        IEnumerable<PricingRule> rules)
    {
        if (start >= end)
            throw new ArgumentException("The slot must end later on the same local day.");
        if (court.BaseHourlyRate < 0)
            throw new ArgumentException("Court base rate must be non-negative.");

        var day = (short)date.DayOfWeek;
        var applicable = rules.Where(r => r.IsActive &&
                (r.CourtId is null || r.CourtId == court.Id) &&
                (r.DayOfWeek is null || r.DayOfWeek == day) &&
                r.StartsAt < r.EndsAt &&
                r.StartsAt < end && r.EndsAt > start)
            .ToArray();

        var boundaries = new SortedSet<TimeOnly> { start, end };
        foreach (var rule in applicable)
        {
            if (rule.StartsAt > start && rule.StartsAt < end)
                boundaries.Add(rule.StartsAt);
            if (rule.EndsAt > start && rule.EndsAt < end)
                boundaries.Add(rule.EndsAt);
        }

        var points = boundaries.ToArray();
        decimal total = 0m;
        for (var i = 0; i < points.Length - 1; i++)
        {
            var from = points[i];
            var to = points[i + 1];
            var winner = applicable
                .Where(r => r.StartsAt <= from && r.EndsAt >= to)
                .OrderByDescending(r => r.CourtId.HasValue)
                .ThenByDescending(r => r.Priority)
                .ThenByDescending(r => r.Id)
                .FirstOrDefault();
            var rate = winner?.HourlyRate ?? court.BaseHourlyRate;
            var minutes = (decimal)(to.ToTimeSpan() - from.ToTimeSpan()).TotalMinutes;
            total += rate * minutes / 60m;
        }
        return total;
    }
}
