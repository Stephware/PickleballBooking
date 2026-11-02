using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Bookings;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Availability;

namespace Pickleball.Api.Services.Bookings;

public sealed class BookingService(
    PickleballDbContext db, IUnitOfWork unit, IBookingRepository bookings,
    IVenueRepository venues, IAvailabilityService availability,
    GuestBookingTokens tokens, TimeProvider clock) : IBookingService
{
    // One to eight consecutive configured slots in one atomic booking.
    private const int MaximumSlotsPerBooking = 8;

    public async Task<CreatedBookingResponse> CreateAsync(
        CreateBookingRequest request, CancellationToken ct)
    {
        ValidateCreate(request);
        var code = tokens.BookingCode(request.IdempotencyKey); // fails if no secure secret
        var contactPhone = Normalize(request.GuestPhone);
        var contactEmail = Normalize(request.GuestEmail)?.ToLowerInvariant();
        var name = request.GuestName.Trim();

        try
        {
            await using var tx = await unit.BeginTransactionAsync(ct);
            // Required: an expired HELD row still triggers the GiST exclusion
            // until its status is changed in PostgreSQL. Do this in the same tx.
            await ExpirePendingAsync(ct);

            var existing = await bookings.FindByCodeAsync(code, ct);
            if (existing is not null)
            {
                var oldSchedule = await db.CourtScheduleEntries.AsNoTracking()
                    .SingleAsync(s => s.Id == existing.ScheduleEntryId, ct);
                var existingVenue = await RequireVenueAsync(ct);
                if (!EquivalentRequest(existing, oldSchedule, request, contactPhone, contactEmail,
                    TimeZoneInfo.FindSystemTimeZoneById(existingVenue.Timezone)))
                    throw new BookingException(BookingError.Conflict,
                        "Idempotency key was already used for a different reservation.");

                var replay = new CreatedBookingResponse(
                    ToResponse(existing, oldSchedule, existingVenue.Currency),
                    tokens.AccessToken(code));
                await tx.CommitAsync(ct);
                return replay;
            }

            var venue = await RequireVenueAsync(ct);
            if (venue.SlotMinutes is not (30 or 60 or 90 or 120))
                throw new BookingException(BookingError.Unavailable,
                    "Venue slot duration is not configured correctly.");

            // Reuse Phase 4 checks while inside the transaction; SQL exclusion
            // still makes the final insert safe when another user races us.
            var day = await availability.GetDayAsync(request.Date, request.CourtId, ct);
            var court = day.Courts.SingleOrDefault(c => c.CourtId == request.CourtId);
            if (court is null)
                throw new BookingException(BookingError.NotFound, "Court not found.");

            var selected = court.Slots
                .Where(s => s.StartsAt >= request.StartsAt && s.EndsAt <= request.EndsAt)
                .OrderBy(s => s.StartsAt).ToArray();
            var aligned = selected.Length is > 0 and <= MaximumSlotsPerBooking &&
                selected[0].StartsAt == request.StartsAt &&
                selected[^1].EndsAt == request.EndsAt &&
                selected.Zip(selected.Skip(1)).All(p => p.First.EndsAt == p.Second.StartsAt);
            if (!aligned || day.IsClosed)
                throw new BookingException(BookingError.InvalidInput,
                    "Select consecutive complete time slots within venue operating hours.");

            if (selected.Any(s => s.Status != AvailabilityStatuses.Available))
                throw new BookingException(BookingError.Unavailable,
                    "One or more selected slots are no longer available.");

            var startUtc = selected[0].StartsAtUtc.UtcDateTime;
            var endUtc = selected[^1].EndsAtUtc.UtcDateTime;
            var now = clock.GetUtcNow().UtcDateTime;
            if (startUtc <= now)
                throw new BookingException(BookingError.Unavailable, "The selected time has passed.");

            var total = selected.Sum(s => s.TotalPrice);
            if (total is < 0m or > 99999999.99m)
                throw new BookingException(BookingError.InvalidInput, "Price exceeds booking limit.");

            var expiry = now.AddMinutes(venue.HoldMinutes);
            if (expiry > startUtc) expiry = startUtc;
            if (expiry <= now)
                throw new BookingException(BookingError.Unavailable,
                    "This time is too close to the current time.");

            var schedule = new CourtScheduleEntry
            {
                CourtId = request.CourtId, EntryType = ScheduleEntryTypes.Booking,
                Status = BookingStatuses.Held, StartsAt = startUtc,
                EndsAt = endUtc, ExpiresAt = expiry
            };
            db.CourtScheduleEntries.Add(schedule);
            await unit.SaveChangesAsync(ct); // get identity ID, still uncommitted

            var booking = new Booking
            {
                BookingCode = code,
                ScheduleEntryId = schedule.Id,
                GuestName = name, GuestPhone = contactPhone, GuestEmail = contactEmail,
                Notes = Normalize(request.Notes), TotalAmount = total,
                RequiredDeposit = 0m // Payment policy and proof are Phase 6.
            };
            bookings.Add(booking);
            await unit.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);

            return new CreatedBookingResponse(ToResponse(booking, schedule, venue.Currency),
                tokens.AccessToken(code));
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg &&
            pg.SqlState is PostgresErrorCodes.ExclusionViolation or PostgresErrorCodes.UniqueViolation)
        {
            // 23P01 = active slot conflict; 23505 = idempotency key collision/race.
            // Transaction is rolled back; a same-key retry can retrieve first result.
            throw new BookingException(BookingError.Conflict,
                "The court was just reserved or this booking was already submitted. Refresh or retry with the same idempotency key.");
        }
        catch (ArgumentOutOfRangeException)
        {
            throw new BookingException(BookingError.InvalidInput,
                "Booking date is outside the permitted reservation window.");
        }
        catch (KeyNotFoundException)
        {
            throw new BookingException(BookingError.NotFound, "Court not found.");
        }
    }

    public async Task<BookingResponse> GetGuestAsync(
        string code, string? token, CancellationToken ct)
    {
        RequireGuestAccess(code, token);
        var booking = await bookings.FindByCodeAsync(code, ct) ?? throw Missing();
        var schedule = await db.CourtScheduleEntries.AsNoTracking()
            .SingleAsync(s => s.Id == booking.ScheduleEntryId, ct);
        var venue = await RequireVenueAsync(ct);
        return ToResponse(booking, schedule, venue.Currency);
    }

    public async Task<BookingResponse> CancelGuestAsync(
        string code, string? token, CancelBookingRequest request, CancellationToken ct)
    {
        RequireGuestAccess(code, token);
        return await TransitionAsync(code, request.Reason, false, false, ct);
    }

    public Task<BookingResponse> ConfirmStaffAsync(string code, CancellationToken ct) =>
        TransitionAsync(code, null, true, true, ct);

    public Task<BookingResponse> CancelStaffAsync(
        string code, CancelBookingRequest request, CancellationToken ct) =>
        TransitionAsync(code, request.Reason, true, false, ct);

    public async Task<IReadOnlyList<AdminBookingResponse>> ListStaffAsync(
        DateOnly date, CancellationToken ct)
    {
        var venue = await RequireVenueAsync(ct);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(venue.Timezone);
        var start = TimeZoneInfo.ConvertTimeToUtc(date.ToDateTime(TimeOnly.MinValue), zone);
        var end = TimeZoneInfo.ConvertTimeToUtc(
            date.AddDays(1).ToDateTime(TimeOnly.MinValue), zone);
        var rows = await (
            from b in db.Bookings.AsNoTracking()
            join s in db.CourtScheduleEntries.AsNoTracking()
                on b.ScheduleEntryId equals s.Id
            where s.StartsAt < end && s.EndsAt > start
            orderby s.StartsAt, b.Id
            select new { Booking = b, Schedule = s })
            .Take(500).ToListAsync(ct);
        return rows.Select(row => new AdminBookingResponse(
            row.Booking.BookingCode, row.Schedule.CourtId,
            row.Schedule.Status, AsOffset(row.Schedule.StartsAt),
            AsOffset(row.Schedule.EndsAt), row.Booking.GuestName,
            row.Booking.GuestPhone, row.Booking.GuestEmail,
            row.Booking.TotalAmount, AsNullableOffset(row.Schedule.ExpiresAt)))
            .ToArray();
    }

    private async Task<BookingResponse> TransitionAsync(
        string code, string? reason, bool staff, bool confirm, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw Missing();
        if (reason?.Length > 300)
            throw new BookingException(BookingError.InvalidInput, "Reason is too long.");

        await using var tx = await unit.BeginTransactionAsync(ct);
        await ExpirePendingAsync(ct);
        var booking = await bookings.FindByCodeAsync(code, ct) ?? throw Missing();
        var now = clock.GetUtcNow().UtcDateTime;

        var query = db.CourtScheduleEntries.Where(s =>
            s.Id == booking.ScheduleEntryId && s.StartsAt > now);

        int affected;
        if (confirm)
        {
            // Only a live hold can be confirmed, never an expired one.
            affected = await query.Where(s => s.Status == BookingStatuses.Held &&
                    s.ExpiresAt > now)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Status, BookingStatuses.Confirmed)
                    .SetProperty(s => s.ExpiresAt, (DateTime?)null), ct);
        }
        else
        {
            affected = await query.Where(s => s.Status == BookingStatuses.Held ||
                    s.Status == BookingStatuses.AwaitingReview ||
                    (staff && s.Status == BookingStatuses.Confirmed))
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(s => s.Status, BookingStatuses.Cancelled)
                    .SetProperty(s => s.ExpiresAt, (DateTime?)null), ct);
            if (affected == 1 && !string.IsNullOrWhiteSpace(reason))
            {
                await db.Bookings.Where(b => b.Id == booking.Id)
                    .ExecuteUpdateAsync(setters => setters.SetProperty(
                        b => b.CancellationReason, reason.Trim()), ct);
            }
        }

        if (affected != 1)
            throw new BookingException(BookingError.Conflict,
                "This booking cannot be changed in its current status or after its start time.");

        await tx.CommitAsync(ct);
        var updated = await db.CourtScheduleEntries.AsNoTracking()
            .SingleAsync(s => s.Id == booking.ScheduleEntryId, ct);
        var venue = await RequireVenueAsync(ct);
        return ToResponse(booking, updated, venue.Currency);
    }

    private async Task ExpirePendingAsync(CancellationToken ct) =>
        _ = await db.Database.SqlQueryRaw<int>(
            "SELECT expire_pending_schedule_entries() AS \"Value\"").SingleAsync(ct);

    private async Task<VenueSettings> RequireVenueAsync(CancellationToken ct) =>
        await venues.GetAsync(ct) ?? throw new BookingException(
            BookingError.Unavailable, "Venue settings are unavailable.");

    private void RequireGuestAccess(string code, string? token)
    {
        // Invalid/unknown token or reference is indistinguishable from not found.
        if (!tokens.Verify(code, token)) throw Missing();
    }

    private static BookingException Missing() =>
        new(BookingError.NotFound, "Booking not found.");

    private static bool EquivalentRequest(
        Booking stored, CourtScheduleEntry schedule,
        CreateBookingRequest request, string? phone, string? email, TimeZoneInfo zone)
    {
        // The idempotency key is unique to this customer intent; do not leak
        // someone else's booking on an accidental key collision.
        return schedule.CourtId == request.CourtId &&
            stored.GuestName == request.GuestName.Trim() &&
            stored.GuestPhone == phone && stored.GuestEmail == email &&
            stored.Notes == Normalize(request.Notes) &&
            DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(schedule.StartsAt, zone)) == request.Date &&
            TimeOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(schedule.StartsAt, zone)) == request.StartsAt &&
            TimeOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(schedule.EndsAt, zone)) == request.EndsAt;
    }

    private static void ValidateCreate(CreateBookingRequest r)
    {
        if (r.IdempotencyKey == Guid.Empty ||
            r.IdempotencyKey.ToString("D")[14] != '4')
            throw new BookingException(BookingError.InvalidInput,
                "Generate a unique UUID v4 idempotencyKey for each intended booking.");
        if (r.CourtId <= 0 || r.Date == default || r.StartsAt >= r.EndsAt)
            throw new BookingException(BookingError.InvalidInput,
                "Provide a valid court, date, and same-day time range.");
        if (string.IsNullOrWhiteSpace(r.GuestName) || r.GuestName.Trim().Length > 150)
            throw new BookingException(BookingError.InvalidInput, "Guest name is invalid.");
        if (Normalize(r.GuestPhone) is null && Normalize(r.GuestEmail) is null)
            throw new BookingException(BookingError.InvalidInput,
                "Provide a phone number or email address.");
        if (r.GuestPhone?.Length > 32 || r.GuestEmail?.Length > 254 ||
            r.Notes?.Length > 500)
            throw new BookingException(BookingError.InvalidInput,
                "Contact information or notes exceed allowed length.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static DateTimeOffset AsOffset(DateTime utc) =>
        new(DateTime.SpecifyKind(utc, DateTimeKind.Utc), TimeSpan.Zero);

    private static DateTimeOffset? AsNullableOffset(DateTime? utc) =>
        utc.HasValue ? AsOffset(utc.Value) : null;

    private static BookingResponse ToResponse(
        Booking b, CourtScheduleEntry s, string currency) =>
        new(b.BookingCode, s.CourtId, s.Status,
            AsOffset(s.StartsAt), AsOffset(s.EndsAt),
            b.TotalAmount, currency.Trim(), AsNullableOffset(s.ExpiresAt));
}
