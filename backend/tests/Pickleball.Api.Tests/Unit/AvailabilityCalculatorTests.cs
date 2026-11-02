using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Services.Availability;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class AvailabilityCalculatorTests
{
    private static readonly DateTime Now =
        new(2026, 11, 3, 2, 0, 0, DateTimeKind.Utc);

    private static CourtScheduleEntry Entry(string status, int minutesFromNow = 90) =>
        new()
        {
            CourtId = 1,
            StartsAt = Now.AddMinutes(minutesFromNow),
            EndsAt = Now.AddMinutes(minutesFromNow + 60),
            Status = status,
            EntryType = status == BookingStatuses.Blocked ? "BLOCK" : "BOOKING",
            // Past expiry must not bypass DB exclusion until status is transitioned.
            ExpiresAt = status is BookingStatuses.Held or BookingStatuses.AwaitingReview
                ? Now.AddMinutes(-1) : null
        };

    private static string Resolve(IEnumerable<CourtScheduleEntry> entries,
        int minutesFromNow = 90, int noticeMinutes = 30, bool insideHorizon = true) =>
        AvailabilityCalculator.GetStatus(Now.AddMinutes(minutesFromNow),
            Now.AddMinutes(minutesFromNow + 60), Now,
            Now.AddMinutes(noticeMinutes), insideHorizon, entries);

    [Fact]
    public void OpenFutureSlot_IsAvailable() =>
        Assert.Equal(AvailabilityStatuses.Available, Resolve([]));

    [Fact]
    public void StartedSlot_IsElapsedEvenIfNotFinished() =>
        Assert.Equal(AvailabilityStatuses.Elapsed, Resolve([], minutesFromNow: -15));

    [Fact]
    public void MinimumNotice_BlocksOtherwiseOpenSlot() =>
        Assert.Equal(AvailabilityStatuses.Unavailable,
            Resolve([], minutesFromNow: 20, noticeMinutes: 30));

    [Fact]
    public void BookingHorizon_BlocksSlot() =>
        Assert.Equal(AvailabilityStatuses.Unavailable, Resolve([], insideHorizon: false));

    [Fact]
    public void ActiveHoldWithPastExpiry_StaysPendingUntilStatusExpires() =>
        Assert.Equal(AvailabilityStatuses.Pending, Resolve([Entry(BookingStatuses.Held)]));

    [Fact]
    public void ConfirmedReservation_IsOccupied() =>
        Assert.Equal(AvailabilityStatuses.Occupied,
            Resolve([Entry(BookingStatuses.Confirmed)]));

    [Fact]
    public void BlockOverridesConfirmed_AndConfirmedOverridesHeld()
    {
        Assert.Equal(AvailabilityStatuses.Blocked,
            Resolve([Entry(BookingStatuses.Held), Entry(BookingStatuses.Confirmed),
                Entry(BookingStatuses.Blocked)]));
        Assert.Equal(AvailabilityStatuses.Occupied,
            Resolve([Entry(BookingStatuses.Held), Entry(BookingStatuses.Confirmed)]));
    }

    [Fact]
    public void AdjacentAndCancelledEntries_DoNotBlockSlot()
    {
        var endsAtStart = new CourtScheduleEntry
        {
            StartsAt = Now.AddMinutes(30),
            EndsAt = Now.AddMinutes(90),
            Status = BookingStatuses.Confirmed
        };
        Assert.Equal(AvailabilityStatuses.Available,
            Resolve([endsAtStart, Entry(BookingStatuses.Cancelled)]));
    }

    [Fact]
    public void UnsupportedReverseSlot_IsRejected()
    {
        Assert.Throws<ArgumentException>(() =>
            AvailabilityCalculator.GetStatus(Now.AddHours(2), Now.AddHours(1),
                Now, Now, true, []));
    }
}
