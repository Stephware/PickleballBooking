using Pickleball.Api.Services.Availability;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class LocalTimeSlotsTests
{
    [Fact]
    public void Manila_DaytimeSlotsResolveToExpectedUtc()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Manila");
        var slots = LocalTimeSlots.Generate(new DateOnly(2026, 11, 3),
            new TimeOnly(8, 0), new TimeOnly(12, 0), 60, tz);

        Assert.Equal(4, slots.Count);
        Assert.Equal(new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc), slots[0].StartUtc);
        Assert.Equal(new TimeOnly(12, 0), slots[^1].End);
    }

    [Fact]
    public void LastIncompleteSlot_IsNotOffered()
    {
        var slots = LocalTimeSlots.Generate(new DateOnly(2026, 11, 3),
            new TimeOnly(9, 0), new TimeOnly(10, 15), 60, TimeZoneInfo.Utc);

        Assert.Single(slots);
        Assert.Equal(new TimeOnly(10, 0), slots[0].End);
    }

    [Fact]
    public void InvalidOrOvernightHours_ReturnEmpty()
    {
        Assert.Empty(LocalTimeSlots.Generate(new DateOnly(2026, 11, 3),
            new TimeOnly(22, 0), new TimeOnly(7, 0), 60, TimeZoneInfo.Utc));
    }

    [Fact]
    public void DaylightSavingGap_IsSkippedInsteadOfGuessingAnOffset()
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById("America/New_York");
        // US spring-forward March 8, 2026 at 02:00 -> 03:00.
        var slots = LocalTimeSlots.Generate(new DateOnly(2026, 3, 8),
            new TimeOnly(1, 0), new TimeOnly(4, 0), 30, tz);

        Assert.DoesNotContain(slots, s => s.Start.Hour == 2 || s.End.Hour == 2);
    }
}
