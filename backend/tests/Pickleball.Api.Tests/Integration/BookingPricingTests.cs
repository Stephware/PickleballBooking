using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.DTOs.Operations;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Bookings;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Scheduling;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Availability;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Operations;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class BookingPricingTests
{
    [Theory]
    [InlineData(false, 1, "0.51")]
    [InlineData(false, 2, "1.01")]
    [InlineData(true, 1, "0.51")]
    [InlineData(true, 2, "1.01")]
    public async Task ReservationTotal_RoundsOnceAcrossSelectedSlots(bool manual, int slotCount, string expected)
    {
        var connection = Environment.GetEnvironmentVariable("PICKLEBALL_TEST_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connection) ||
            Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
            Assert.Skip("Requires an explicitly enabled disposable PostgreSQL test database.");
        Assert.EndsWith("_test", new NpgsqlConnectionStringBuilder(connection).Database);
        var ct = TestContext.Current.CancellationToken;
        await using var db = new PickleballDbContext(new DbContextOptionsBuilder<PickleballDbContext>()
            .UseNpgsql(connection).Options);
        var suffix = Guid.NewGuid().ToString("N");
        var court = new Court { CourtName = "__rounding_test_" + suffix, BaseHourlyRate = 1.01m, IsActive = true };
        var staff = new StaffUser { FullName = "Rounding test", Email = suffix + "@example.test",
            PasswordHash = "test-only-not-a-login", Role = "STAFF", IsActive = true };
        db.AddRange(court, staff);
        await db.SaveChangesAsync(ct);
        try
        {
            var venue = new TestVenue();
            var availability = new AvailabilityService(venue, new CourtRepository(db),
                new ScheduleRepository(db), TimeProvider.System);
            var date = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(3);
            var day = await availability.GetDayAsync(date, court.Id, ct);
            Assert.All(day.Courts.Single().Slots, slot => Assert.Equal(0.51m, slot.TotalPrice));
            var quote = await availability.GetQuoteAsync(date, court.Id, new TimeOnly(8, 0), ct);
            Assert.NotNull(quote);
            Assert.Equal(0.51m, quote.TotalPrice);
            var json = System.Text.Json.JsonSerializer.Serialize(day,
                new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web));
            Assert.DoesNotContain("unrounded", json, StringComparison.OrdinalIgnoreCase);
            var tokens = new GuestBookingTokens(new ConfigurationBuilder().AddInMemoryCollection(
                new Dictionary<string, string?> { ["Booking:SigningKey"] = Guid.NewGuid().ToString("N") }).Build());
            var unit = new EfUnitOfWork(db);
            var start = new TimeOnly(8, 0);
            var end = start.AddMinutes(slotCount * 30);
            var created = manual
                ? await new OperationsService(db, unit, venue, availability, new ScheduleRepository(db),
                        tokens, TimeProvider.System)
                    .CreateManualAsync(new CreateManualBookingRequest { CourtId = court.Id, Date = date,
                        StartsAt = start, EndsAt = end, Channel = "WALK_IN",
                        GuestName = "Synthetic guest", GuestPhone = "test-only" }, staff.Id, ct)
                : await new BookingService(db, unit, new BookingRepository(db), venue, availability,
                        tokens, TimeProvider.System)
                    .CreateAsync(new CreateBookingRequest { IdempotencyKey = Guid.NewGuid(), CourtId = court.Id,
                        Date = date, StartsAt = start, EndsAt = end,
                        GuestName = "Synthetic guest", GuestPhone = "test-only" }, ct);
            var total = decimal.Parse(expected, System.Globalization.CultureInfo.InvariantCulture);
            Assert.Equal(total, created.Booking.TotalAmount);
            Assert.Equal(total, (await db.Bookings.AsNoTracking().SingleAsync(
                b => b.BookingCode == created.Booking.BookingCode, ct)).TotalAmount);
        }
        finally
        {
            var scheduleIds = db.CourtScheduleEntries.Where(s => s.CourtId == court.Id).Select(s => s.Id);
            await db.Bookings.Where(b => scheduleIds.Contains(b.ScheduleEntryId)).ExecuteDeleteAsync(CancellationToken.None);
            await db.CourtScheduleEntries.Where(s => s.CourtId == court.Id).ExecuteDeleteAsync(CancellationToken.None);
            await db.Courts.Where(c => c.Id == court.Id).ExecuteDeleteAsync(CancellationToken.None);
            await db.StaffUsers.Where(s => s.Id == staff.Id).ExecuteDeleteAsync(CancellationToken.None);
        }
    }

    // Isolate configuration without changing the shared disposable venue row.
    private sealed class TestVenue : IVenueRepository
    {
        public Task<VenueSettings?> GetAsync(CancellationToken ct = default) =>
            Task.FromResult<VenueSettings?>(new() { Id = 1, Timezone = "Asia/Manila", Currency = "PHP",
                SlotMinutes = 30, BookingAdvanceDays = 30, HoldMinutes = 15 });
        public Task<IReadOnlyList<OperatingHour>> GetHoursAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<OperatingHour>>(Enumerable.Range(0, 7).Select(day =>
                new OperatingHour { DayOfWeek = (short)day, OpensAt = new TimeOnly(8, 0),
                    ClosesAt = new TimeOnly(10, 0) }).ToArray());
        public Task<IReadOnlyList<PricingRule>> GetActivePricingRulesAsync(CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<PricingRule>>([]);
    }
}
