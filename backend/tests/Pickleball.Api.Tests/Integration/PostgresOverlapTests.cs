using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

/// <summary>
/// Explicit opt-in database constraint verification against an ISOLATED test DB.
/// Everything is rolled back. Never enable mutations on a venue/production DB.
/// </summary>
public sealed class PostgresOverlapTests
{
    [Fact]
    public async Task PostgreSqlExclusionConstraint_RejectsOverlappingHolds()
    {
        var connection = Environment.GetEnvironmentVariable("PICKLEBALL_TEST_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connection) ||
            Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
            return;

        await using var db = new PickleballDbContext(
            new DbContextOptionsBuilder<PickleballDbContext>()
                .UseNpgsql(connection).Options);
        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var court = new Court
            {
                CourtName = "__phase5_constraint_" + Guid.NewGuid().ToString("N"),
                BaseHourlyRate = 250m, IsActive = true
            };
            db.Courts.Add(court);
            await db.SaveChangesAsync();

            var start = DateTime.UtcNow.Date.AddDays(2).AddHours(2);
            var first = new CourtScheduleEntry
            {
                CourtId = court.Id, EntryType = ScheduleEntryTypes.Booking,
                Status = BookingStatuses.Held,
                StartsAt = start, EndsAt = start.AddHours(1),
                ExpiresAt = DateTime.UtcNow.AddMinutes(15)
            };
            db.CourtScheduleEntries.Add(first);
            await db.SaveChangesAsync();

            var overlapping = new CourtScheduleEntry
            {
                CourtId = court.Id, EntryType = ScheduleEntryTypes.Booking,
                Status = BookingStatuses.Confirmed,
                StartsAt = start.AddMinutes(30), EndsAt = start.AddMinutes(90)
            };
            db.CourtScheduleEntries.Add(overlapping);
            var error = await Assert.ThrowsAsync<DbUpdateException>(
                () => db.SaveChangesAsync());
            Assert.Equal(PostgresErrorCodes.ExclusionViolation,
                (error.InnerException as PostgresException)?.SqlState);
        }
        finally
        {
            await transaction.RollbackAsync();
        }
    }
    [Fact]
    public async Task ExpiredHold_ReleasesSlotOnlyAfterSqlStatusTransition()
    {
        var connection = Environment.GetEnvironmentVariable("PICKLEBALL_TEST_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connection) ||
            Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
            return;

        await using var db = new PickleballDbContext(
            new DbContextOptionsBuilder<PickleballDbContext>()
                .UseNpgsql(connection).Options);
        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var court = new Court
            {
                CourtName = "__phase5_expiry_" + Guid.NewGuid().ToString("N"),
                BaseHourlyRate = 250m, IsActive = true
            };
            db.Courts.Add(court);
            await db.SaveChangesAsync();

            var start = DateTime.UtcNow.Date.AddDays(2).AddHours(2);
            var held = new CourtScheduleEntry
            {
                CourtId = court.Id, EntryType = ScheduleEntryTypes.Booking,
                Status = BookingStatuses.Held,
                StartsAt = start, EndsAt = start.AddHours(1),
                ExpiresAt = DateTime.UtcNow.AddSeconds(-5)
            };
            db.CourtScheduleEntries.Add(held);
            await db.SaveChangesAsync();

            // The exclusion is status-driven, not automatically time-driven.
            var expiredCount = await db.Database.SqlQueryRaw<int>(
                "SELECT expire_pending_schedule_entries() AS \"Value\"")
                .SingleAsync();
            Assert.True(expiredCount >= 1);
            var persisted = await db.CourtScheduleEntries.AsNoTracking()
                .SingleAsync(s => s.Id == held.Id);
            Assert.Equal(BookingStatuses.Expired, persisted.Status);
            Assert.Null(persisted.ExpiresAt);

            // An active booking may now occupy the former hold's exact interval.
            db.CourtScheduleEntries.Add(new CourtScheduleEntry
            {
                CourtId = court.Id, EntryType = ScheduleEntryTypes.Booking,
                Status = BookingStatuses.Confirmed, StartsAt = start,
                EndsAt = start.AddHours(1)
            });
            await db.SaveChangesAsync();
        }
        finally
        {
            await transaction.RollbackAsync();
        }
    }

}
