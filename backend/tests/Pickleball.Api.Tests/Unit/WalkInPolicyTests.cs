using Pickleball.Api.DTOs.Availability;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Services.Operations;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class WalkInPolicyTests
{
    private static readonly DateTimeOffset Start =
        new(2026, 11, 4, 1, 0, 0, TimeSpan.Zero); // 9:00 AM Manila

    private static AvailabilitySlotResponse Slot(string status = AvailabilityStatuses.Elapsed) =>
        new(new TimeOnly(9, 0), new TimeOnly(10, 0),
            Start, Start.AddHours(1), status, 250m);

    [Fact]
    public void StartedSlotWithinThirtyMinutes_IsEligibleForStaffOnly()
    {
        Assert.True(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(10).UtcDateTime, 60));
        Assert.True(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(30).UtcDateTime, 60));
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(31).UtcDateTime, 60));
    }

    [Fact]
    public void ThirtyMinuteSlotsHaveFifteenMinuteGrace()
    {
        Assert.True(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(15).UtcDateTime, 30));
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(16).UtcDateTime, 30));
    }

    [Fact]
    public void FutureCompletedOrNonElapsedSlots_AreNotEligible()
    {
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(-1).UtcDateTime, 60));
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddHours(1).UtcDateTime, 60));
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(AvailabilityStatuses.Occupied), Start.AddMinutes(1).UtcDateTime, 60));
        Assert.False(WalkInPolicy.IsWithinGrace(
            Slot(), Start.AddMinutes(1).UtcDateTime, 0));
    }
}
