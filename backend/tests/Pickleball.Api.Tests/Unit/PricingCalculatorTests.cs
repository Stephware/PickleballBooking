using Pickleball.Api.Models.Entities;
using Pickleball.Api.Services.Pricing;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class PricingCalculatorTests
{
    private static Court Court(long id = 1, decimal rate = 250m) =>
        new() { Id = id, CourtName = "Test Court", BaseHourlyRate = rate, IsActive = true };

    private static PricingRule Rule(
        long id, long? courtId, short? day, string from, string to,
        decimal rate, int priority = 0, bool active = true) =>
        new()
        {
            Id = id, CourtId = courtId, DayOfWeek = day,
            StartsAt = TimeOnly.Parse(from), EndsAt = TimeOnly.Parse(to),
            HourlyRate = rate, Priority = priority, IsActive = active
        };

    [Fact]
    public void NoRule_UsesBaseRateProportionally()
    {
        var price = PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 3),
            new TimeOnly(9, 0), new TimeOnly(9, 30), []);
        Assert.Equal(125m, price);
    }

    [Fact]
    public void PeakRule_PricesPartialTwoHourSlotByActualMinutes()
    {
        // 18:00-19:00 base 250, 19:00-20:00 peak 400.
        var price = PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 3),
            new TimeOnly(18, 0), new TimeOnly(20, 0),
            [Rule(1, null, null, "19:00", "22:00", 400m)]);
        Assert.Equal(650m, price);
    }

    [Fact]
    public void CourtSpecificRule_BeatsHigherPriorityVenueRule()
    {
        var price = PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 3),
            new TimeOnly(10, 0), new TimeOnly(11, 0),
            [
                Rule(1, null, null, "08:00", "22:00", 800m, priority: 100),
                Rule(2, 1, null, "10:00", "11:00", 300m, priority: 0)
            ]);
        Assert.Equal(300m, price);
    }

    [Fact]
    public void HigherPriorityThenNewestId_WinsBetweenMatchingRules()
    {
        var price = PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 3),
            new TimeOnly(9, 0), new TimeOnly(10, 0),
            [
                Rule(10, null, null, "08:00", "12:00", 340m, priority: 2),
                Rule(11, null, null, "08:00", "12:00", 360m, priority: 2),
                Rule(12, null, null, "08:00", "12:00", 999m, priority: 1)
            ]);
        Assert.Equal(360m, price);
    }

    [Fact]
    public void DaySpecificRulesAndInactiveRules_AreFiltered()
    {
        // November 7, 2026 = Saturday = 6.
        var price = PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 7),
            new TimeOnly(15, 0), new TimeOnly(16, 0),
            [
                Rule(1, null, 6, "08:00", "22:00", 375m),
                Rule(2, null, 0, "08:00", "22:00", 500m),
                Rule(3, null, null, "08:00", "22:00", 900m, priority: 50, active: false)
            ]);
        Assert.Equal(375m, price);
    }

    [Fact]
    public void PartialRate_PricesToTwoDecimalPlaces()
    {
        var price = PricingCalculator.Calculate(Court(rate: 199m),
            new DateOnly(2026, 11, 3), new TimeOnly(9, 0), new TimeOnly(9, 30), []);
        Assert.Equal(99.50m, price);
    }

    [Fact]
    public void InvalidInterval_IsRejected()
    {
        Assert.Throws<ArgumentException>(() =>
            PricingCalculator.Calculate(Court(), new DateOnly(2026, 11, 3),
                new TimeOnly(12, 0), new TimeOnly(11, 0), []));
    }
}
