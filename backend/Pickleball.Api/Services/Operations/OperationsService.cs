using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Availability;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.DTOs.Operations;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Repositories.Scheduling;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Availability;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Pricing;

namespace Pickleball.Api.Services.Operations;

/// <summary>Staff manual bookings and maintenance blocks share the same GiST schedule.</summary>
public sealed class OperationsService(
    PickleballDbContext db, IUnitOfWork unit, IVenueRepository venues,
    IAvailabilityService availability, IScheduleRepository schedules, GuestBookingTokens tokens,
    TimeProvider clock) : IOperationsService
{
    /// <summary>
    /// Staff-only schedule view. Exactly one current, unoccupied slot per court
    /// may be available for an immediate walk-in during a short grace window.
    /// The public availability endpoint stays strict and never exposes it.
    /// </summary>
    public async Task<AvailabilityDayResponse> GetStaffAvailabilityAsync(
        DateOnly date, CancellationToken ct)
    {
        var day = await availability.GetDayAsync(date, null, ct);
        var now = clock.GetUtcNow().UtcDateTime;
        var candidates = day.Courts.SelectMany(c => c.Slots
            .Where(s => WalkInPolicy.IsWithinGrace(s, now, day.SlotMinutes))
            .Select(s => new { c.CourtId, Slot = s })).ToArray();
        if (candidates.Length == 0) return day;

        // One batched query across all courts. Stale HELD records still block
        // until their persisted status changes to EXPIRED.
        var active = await schedules.ListActiveInRangeAsync(
            candidates.Min(x => x.Slot.StartsAtUtc.UtcDateTime),
            candidates.Max(x => x.Slot.EndsAtUtc.UtcDateTime), ct);
        var available = candidates.Where(x => !active.Any(e =>
            e.CourtId == x.CourtId &&
            e.StartsAt < x.Slot.EndsAtUtc.UtcDateTime &&
            e.EndsAt > x.Slot.StartsAtUtc.UtcDateTime))
            .Select(x => (x.CourtId, x.Slot.StartsAtUtc))
            .ToHashSet();

        return day with
        {
            Courts = day.Courts.Select(c => c with
            {
                Slots = c.Slots.Select(s =>
                    available.Contains((c.CourtId, s.StartsAtUtc))
                        ? s with { Status = AvailabilityStatuses.WalkInNow }
                        : s).ToArray()
            }).ToArray()
        };
    }

    public async Task<CreatedBookingResponse> CreateManualAsync(
        CreateManualBookingRequest input, long staffId, CancellationToken ct)
    {
        if (input.Channel is not ("WALK_IN" or "PHONE" or "MESSENGER") ||
            string.IsNullOrWhiteSpace(input.GuestName) ||
            input.GuestName.Trim().Length > 150 ||
            input.GuestPhone?.Length > 32 || input.GuestEmail?.Length > 254 ||
            (string.IsNullOrWhiteSpace(input.GuestPhone) &&
             string.IsNullOrWhiteSpace(input.GuestEmail)) ||
            input.Notes?.Length > 500)
            throw Invalid("Valid channel, guest name and contact are required.");

        await using var tx = await unit.BeginTransactionAsync(ct);
        await ExpireAsync(ct);
        var (slots, currency) = await SelectAvailableAsync(input.Date, input.CourtId,
            input.StartsAt, input.EndsAt, ct, input.Channel == "WALK_IN");
        var total = PricingCalculator.RoundTotal(slots.Sum(x => x.UnroundedTotalPrice));
        if (total is < 0m or > 99999999.99m) throw Invalid("Price is outside booking limit.");

        // Structured source note avoids schema changes, but is not a permanent
        // queryable booking_source field. Future migration should add one.
        var notes = "[CHANNEL:" + input.Channel + "]" +
            (string.IsNullOrWhiteSpace(input.Notes) ? "" : "\n" + input.Notes.Trim());
        var schedule = new CourtScheduleEntry
        {
            CourtId = input.CourtId, EntryType = ScheduleEntryTypes.Booking,
            Status = BookingStatuses.Confirmed,
            StartsAt = slots[0].StartsAtUtc.UtcDateTime,
            EndsAt = slots[^1].EndsAtUtc.UtcDateTime,
            CreatedByStaffId = staffId
        };
        db.CourtScheduleEntries.Add(schedule);
        try
        {
            await unit.SaveChangesAsync(ct);
            var booking = new Booking
            {
                ScheduleEntryId = schedule.Id,
                GuestName = input.GuestName.Trim(),
                GuestPhone = Trim(input.GuestPhone),
                GuestEmail = Trim(input.GuestEmail)?.ToLowerInvariant(),
                Notes = notes,
                TotalAmount = total,
                RequiredDeposit = 0m
            };
            db.Bookings.Add(booking); // booking_code SQL-generated
            await unit.SaveChangesAsync(ct);
            // Check secret availability before committing to avoid creating a
            // manual booking that cannot return a guest access token.
            var guestToken = tokens.AccessToken(booking.BookingCode);
            await tx.CommitAsync(ct);
            var response = new BookingResponse(
                booking.BookingCode, schedule.CourtId, schedule.Status,
                Offset(schedule.StartsAt), Offset(schedule.EndsAt),
                booking.TotalAmount, currency, null);
            return new(response, guestToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
            pg.SqlState is PostgresErrorCodes.ExclusionViolation or PostgresErrorCodes.UniqueViolation)
        {
            throw Conflict("This court is no longer free for the requested interval.");
        }
    }

    public async Task<CourtBlockResponse> BlockAsync(
        CreateCourtBlockRequest input, long staffId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.Reason) ||
            input.Reason.Trim().Length is < 3 or > 300)
            throw Invalid("Block reason must be 3–300 characters.");
        await using var tx = await unit.BeginTransactionAsync(ct);
        await ExpireAsync(ct);
        var (slots, _) = await SelectAvailableAsync(input.Date, input.CourtId,
            input.StartsAt, input.EndsAt, ct);
        var entity = new CourtScheduleEntry
        {
            CourtId = input.CourtId, EntryType = ScheduleEntryTypes.Block,
            Status = BookingStatuses.Blocked,
            StartsAt = slots[0].StartsAtUtc.UtcDateTime,
            EndsAt = slots[^1].EndsAtUtc.UtcDateTime,
            BlockReason = input.Reason.Trim(),
            CreatedByStaffId = staffId
        };
        db.CourtScheduleEntries.Add(entity);
        try
        {
            await unit.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            return Map(entity);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
            pg.SqlState == PostgresErrorCodes.ExclusionViolation)
        {
            throw Conflict("The court overlaps an existing reservation or block.");
        }
    }

    public async Task<CourtBlockResponse> UnblockAsync(long id, CancellationToken ct)
    {
        await using var tx = await unit.BeginTransactionAsync(ct);
        var row = await db.CourtScheduleEntries
            .FromSqlInterpolated($"SELECT * FROM court_schedule_entries WHERE id = {id} FOR UPDATE")
            .SingleOrDefaultAsync(ct) ?? throw Missing();
        if (row.EntryType != ScheduleEntryTypes.Block || row.Status != BookingStatuses.Blocked)
            throw Conflict("Block is already removed or not an owner block.");
        row.Status = BookingStatuses.Cancelled;
        await unit.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Map(row);
    }

    public async Task<IReadOnlyList<CourtBlockResponse>> BlocksAsync(DateOnly date, CancellationToken ct)
    {
        if (date == default || date >= DateOnly.MaxValue) throw Invalid("Invalid date.");
        var venue = await venues.GetAsync(ct) ?? throw Conflict("Venue unavailable.");
        var zone = TimeZoneInfo.FindSystemTimeZoneById(venue.Timezone);
        var from = TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(TimeOnly.MinValue), zone);
        var to = TimeZoneInfo.ConvertTimeToUtc(date.AddDays(1).ToDateTime(TimeOnly.MinValue), zone);
        return (await db.CourtScheduleEntries.AsNoTracking()
            .Where(s => s.EntryType == ScheduleEntryTypes.Block &&
                s.StartsAt < to && s.EndsAt > from)
            .OrderBy(s => s.StartsAt).Take(500).ToListAsync(ct))
            .Select(Map).ToArray();
    }

    private async Task<(AvailabilitySlotResponse[] Slots, string Currency)> SelectAvailableAsync(
        DateOnly date, long courtId, TimeOnly start, TimeOnly end,
        CancellationToken ct, bool allowCurrentWalkIn = false)
    {
        if (date == default || courtId <= 0 || start >= end)
            throw Invalid("Invalid court, date or time range.");
        AvailabilityDayResponse day;
        try
        {
            day = allowCurrentWalkIn
                ? await GetStaffAvailabilityAsync(date, ct)
                : await availability.GetDayAsync(date, courtId, ct);
        }
        catch (ArgumentOutOfRangeException) { throw Invalid("Booking is outside allowed date range."); }
        catch (KeyNotFoundException) { throw Missing(); }

        var court = day.Courts.SingleOrDefault(c => c.CourtId == courtId);
        var selected = court?.Slots.Where(s => s.StartsAt >= start && s.EndsAt <= end)
            .OrderBy(s => s.StartsAt).ToArray() ?? [];
        if (selected.Length is < 1 or > 8 || selected[0].StartsAt != start ||
            selected[^1].EndsAt != end ||
            selected.Zip(selected.Skip(1)).Any(p => p.First.EndsAt != p.Second.StartsAt))
            throw Invalid("Choose 1–8 complete consecutive venue slots.");

        var isLiveWalkIn = allowCurrentWalkIn &&
            selected[0].Status == AvailabilityStatuses.WalkInNow;
        if (selected.Where((s, i) => s.Status != AvailabilityStatuses.Available &&
                !(i == 0 && isLiveWalkIn)).Any())
            throw Conflict("One or more requested slots are not available.");

        if (!isLiveWalkIn && selected[0].StartsAtUtc.UtcDateTime <= clock.GetUtcNow().UtcDateTime)
            throw Conflict("The selected start time has passed.");
        return (selected, day.Currency);
    }

    private async Task ExpireAsync(CancellationToken ct) =>
        _ = await db.Database.SqlQueryRaw<int>(
            "SELECT expire_pending_schedule_entries() AS \"Value\"").SingleAsync(ct);

    private static DateTimeOffset Offset(DateTime utc) =>
        new(DateTime.SpecifyKind(utc, DateTimeKind.Utc), TimeSpan.Zero);

    private static CourtBlockResponse Map(CourtScheduleEntry s) =>
        new(s.Id, s.CourtId, Offset(s.StartsAt), Offset(s.EndsAt),
            s.Status, s.BlockReason ?? "", s.CreatedByStaffId);

    private static string? Trim(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static BookingException Invalid(string m) => new(BookingError.InvalidInput, m);
    private static BookingException Conflict(string m) => new(BookingError.Conflict, m);
    private static BookingException Missing() => new(BookingError.NotFound, "Court or block not found.");
}
