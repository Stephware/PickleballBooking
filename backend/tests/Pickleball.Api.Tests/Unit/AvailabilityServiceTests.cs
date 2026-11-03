using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Scheduling;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Services.Availability;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class AvailabilityServiceTests
{
    [Fact]
    public async Task OneDailyQuery_ReturnsIndependentCourtStatusesAndPrices()
    {
        var venue = new FakeVenueRepository();
        var courts = new FakeCourtRepository();
        var schedules = new FakeScheduleRepository();
        var clock = new FixedClock(
            new DateTimeOffset(2026, 11, 3, 0, 30, 0, TimeSpan.Zero)); // 8:30 AM Manila
        var service = new AvailabilityService(venue, courts, schedules, clock);

        var day = await service.GetDayAsync(new DateOnly(2026, 11, 3), null,
            CancellationToken.None);

        Assert.False(day.IsClosed);
        Assert.Equal("Asia/Manila", day.Timezone);
        Assert.Equal(2, day.Courts.Count);
        Assert.Equal(1, schedules.QueryCount);
        var court1 = day.Courts.Single(c => c.CourtId == 1).Slots;
        var court2 = day.Courts.Single(c => c.CourtId == 2).Slots;
        Assert.Equal(3, court1.Count);
        Assert.Equal(AvailabilityStatuses.Elapsed, court1[0].Status);
        Assert.Equal(AvailabilityStatuses.Occupied, court1[1].Status);
        Assert.Equal(AvailabilityStatuses.Available, court1[2].Status);
        Assert.Equal(AvailabilityStatuses.Pending, court2[2].Status);
        Assert.Equal(250m, court1[2].TotalPrice);
        Assert.Equal(300m, court2[1].TotalPrice);

        var quote = await service.GetQuoteAsync(new DateOnly(2026, 11, 3), 2,
            new TimeOnly(9, 0), CancellationToken.None);
        Assert.NotNull(quote);
        Assert.Equal(300m, quote.TotalPrice);
        Assert.Equal(AvailabilityStatuses.Available, quote.AvailabilityStatus);
    }

    [Fact]
    public async Task ClosedDay_NoScheduleQuery()
    {
        var venue = new FakeVenueRepository { Closed = true };
        var schedules = new FakeScheduleRepository();
        var service = new AvailabilityService(venue, new FakeCourtRepository(),
            schedules, new FixedClock(new DateTimeOffset(2026, 11, 3, 0, 30, 0, TimeSpan.Zero)));
        var day = await service.GetDayAsync(new DateOnly(2026, 11, 3), null,
            CancellationToken.None);
        Assert.True(day.IsClosed);
        Assert.All(day.Courts, c => Assert.Empty(c.Slots));
        Assert.Equal(0, schedules.QueryCount);
    }

    private sealed class FixedClock(DateTimeOffset time) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => time;
    }

    private sealed class FakeVenueRepository : IVenueRepository
    {
        public bool Closed { get; init; }
        public Task<VenueSettings?> GetAsync(CancellationToken ct = default) =>
            Task.FromResult<VenueSettings?>(new()
            {
                Id = 1, Timezone = "Asia/Manila", Currency = "PHP",
                SlotMinutes = 60, BookingAdvanceDays = 30, MinimumNoticeMinutes = 15
            });

        public Task<IReadOnlyList<OperatingHour>> GetHoursAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<OperatingHour>>(
            [
                new()
                {
                    DayOfWeek = 2, IsClosed = Closed, // Tuesday
                    OpensAt = Closed ? null : new TimeOnly(8, 0),
                    ClosesAt = Closed ? null : new TimeOnly(11, 0)
                }
            ]);

        public Task<IReadOnlyList<PricingRule>> GetActivePricingRulesAsync(
            CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<PricingRule>>([]);
    }

    private sealed class FakeCourtRepository : ICourtRepository
    {
        private static readonly IReadOnlyList<Court> Courts =
        [
            new() { Id = 1, CourtName = "Court 1", IsActive = true, BaseHourlyRate = 250m },
            new() { Id = 2, CourtName = "Court 2", IsActive = true, BaseHourlyRate = 300m }
        ];

        public Task<IReadOnlyList<Court>> ListAsync(CancellationToken ct = default) =>
            Task.FromResult(Courts);

        public Task<Court?> FindAsync(long id, CancellationToken ct = default) =>
            Task.FromResult(Courts.SingleOrDefault(c => c.Id == id));

        public Task<bool> HasFutureBookingsAsync(long courtId, DateTime now,
            CancellationToken ct = default) => Task.FromResult(false);

        public void Add(Court court) => throw new NotSupportedException();
        public void Remove(Court court) => throw new NotSupportedException();
    }

    private sealed class FakeScheduleRepository : IScheduleRepository
    {
        public int QueryCount { get; private set; }

        private static readonly IReadOnlyList<CourtScheduleEntry> Entries =
        [
            new()
            {
                CourtId = 1, EntryType = "BOOKING", Status = BookingStatuses.Confirmed,
                StartsAt = new DateTime(2026, 11, 3, 1, 0, 0, DateTimeKind.Utc),
                EndsAt = new DateTime(2026, 11, 3, 2, 0, 0, DateTimeKind.Utc)
            },
            new()
            {
                CourtId = 2, EntryType = "BOOKING", Status = BookingStatuses.Held,
                StartsAt = new DateTime(2026, 11, 3, 2, 0, 0, DateTimeKind.Utc),
                EndsAt = new DateTime(2026, 11, 3, 3, 0, 0, DateTimeKind.Utc),
                ExpiresAt = new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc)
            }
        ];

        public Task<IReadOnlyList<CourtScheduleEntry>> ListActiveInRangeAsync(
            DateTime start, DateTime end, CancellationToken ct = default)
        {
            QueryCount++;
            return Task.FromResult(Entries);
        }

        public Task<IReadOnlyList<CourtScheduleEntry>> GetActiveOverlapsAsync(
            long courtId, DateTime start, DateTime end, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CourtScheduleEntry>>(
                Entries.Where(e => e.CourtId == courtId && e.StartsAt < end &&
                                   e.EndsAt > start).ToArray());

        public void Add(CourtScheduleEntry entry) => throw new NotSupportedException();
    }
}
