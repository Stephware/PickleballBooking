using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Payments;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Payments;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Storage;

namespace Pickleball.Api.Services.Payments;

/// <summary>Manual verification of real-world transfers; never claims money moved itself.</summary>
public sealed class PaymentService(
    PickleballDbContext db, IPaymentRepository payments, IUnitOfWork unit,
    IVenueRepository venues, GuestBookingTokens tokens, IProofStorage storage,
    TimeProvider clock) : IPaymentService
{
    public async Task<PaymentResponse> SubmitGuestAsync(
        string code, string? token, SubmitPaymentProofRequest input, CancellationToken ct)
    {
        RequireGuest(code, token);
        var method = input.PaymentMethod?.Trim().ToUpperInvariant();
        if (method is not ("GCASH" or "BANK_TRANSFER") ||
            input.Amount <= 0 || input.Amount > 99999999.99m ||
            decimal.Round(input.Amount, 2) != input.Amount ||
            input.TransactionReference is null ||
            input.TransactionReference.Trim().Length is < 3 or > 150 ||
            input.Proof is null)
            throw Invalid("Supply valid GCash/bank transfer details and payment proof.");

        // Upload to private storage BEFORE acquiring database locks. Clean up
        // on any failed transaction, so rejected requests leave no new proof.
        StoredProof? proof = null;
        var committed = false;
        try
        {
            proof = await storage.SaveAsync(input.Proof, ct);
            await using var tx = await unit.BeginTransactionAsync(ct);
            await ExpireAsync(ct);
            var booking = await FindBookingAsync(code, ct);
            var schedule = await LockScheduleAsync(booking.ScheduleEntryId, ct);
            var now = clock.GetUtcNow().UtcDateTime;
            if (schedule.Status != BookingStatuses.Held || schedule.ExpiresAt <= now ||
                schedule.StartsAt <= now)
                throw Conflict("This booking is no longer accepting payment submissions.");

            // Phase 6 online policy is full payment before approval. No client
            // amount is ever treated as a verified transfer.
            if (booking.TotalAmount <= 0m || input.Amount != booking.TotalAmount)
                throw Invalid("Payment amount must match the complete booking total.");

            if (await db.Payments.AnyAsync(p => p.BookingId == booking.Id &&
                    (p.Status == PaymentStatuses.Submitted ||
                     p.Status == PaymentStatuses.Verified), ct))
                throw Conflict("A payment is already under review or verified.");

            var venue = await RequireVenueAsync(ct);
            var reviewExpiry = now.AddHours(venue.ReviewTimeoutHours);
            if (reviewExpiry > schedule.StartsAt) reviewExpiry = schedule.StartsAt;
            if (reviewExpiry <= now)
                throw Conflict("The booking is too close to its start for payment review.");

            var payment = new Payment
            {
                BookingId = booking.Id, PaymentMethod = method, Amount = input.Amount,
                Status = PaymentStatuses.Submitted,
                TransactionReference = Clean(input.TransactionReference),
                ProofStorageKey = proof.Key, SubmittedAt = now
            };
            payments.Add(payment);
            schedule.Status = BookingStatuses.AwaitingReview;
            schedule.ExpiresAt = reviewExpiry;
            await unit.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            committed = true;
            return Map(payment);
        }
        catch (ArgumentException e)
        {
            throw Invalid(e.Message);
        }
        finally
        {
            if (!committed && proof is not null)
            {
                try { await storage.DeleteAsync(proof.Key, CancellationToken.None); }
                catch { /* Don't hide the original error; orphan cleanup can be retried. */ }
            }
        }
    }

    public async Task<PaymentSummaryResponse> GuestSummaryAsync(
        string code, string? token, CancellationToken ct)
    {
        RequireGuest(code, token);
        return await SummaryAsync(code, ct);
    }

    public Task<PaymentSummaryResponse> StaffSummaryAsync(string code, CancellationToken ct) =>
        SummaryAsync(code, ct);

    private async Task<PaymentSummaryResponse> SummaryAsync(string code, CancellationToken ct)
    {
        var booking = await FindBookingAsync(code, ct);
        var records = await payments.ForBookingAsync(booking.Id, ct);
        var venue = await RequireVenueAsync(ct);
        var verified = records.Where(p => p.Status == PaymentStatuses.Verified)
            .Sum(p => p.Amount);
        var status = await db.CourtScheduleEntries.AsNoTracking()
            .Where(s => s.Id == booking.ScheduleEntryId)
            .Select(s => s.Status).SingleAsync(ct);
        // A cancelled/expired reservation has no payment balance due even if
        // money must still be reconciled or refunded externally.
        var balance = status is BookingStatuses.Cancelled or BookingStatuses.Expired
            ? 0m : Math.Max(0m, booking.TotalAmount - verified);
        return new(code, status, booking.TotalAmount, verified,
            balance, venue.Currency.Trim(), records.Select(Map).ToArray());
    }

    public async Task<PaymentResponse> RecordStaffAsync(
        string code, RecordPaymentRequest input, CancellationToken ct)
    {
        var method = input.PaymentMethod?.Trim().ToUpperInvariant();
        if (method is not ("CASH" or "GCASH" or "BANK_TRANSFER" or "OTHER") ||
            input.Amount <= 0 || input.Amount > 99999999.99m ||
            decimal.Round(input.Amount, 2) != input.Amount ||
            input.TransactionReference?.Length > 150 || input.Notes?.Length > 500 ||
            ((method is "GCASH" or "BANK_TRANSFER") &&
                (string.IsNullOrWhiteSpace(input.TransactionReference) ||
                 input.TransactionReference.Trim().Length < 3)))
            throw Invalid("Invalid payment details.");

        await using var tx = await unit.BeginTransactionAsync(ct);
        var booking = await FindBookingAsync(code, ct);
        var schedule = await LockScheduleAsync(booking.ScheduleEntryId, ct);
        if (schedule.Status != BookingStatuses.Confirmed)
            throw Conflict("Staff-recorded payments require a confirmed booking.");

        var previous = await payments.ForBookingAsync(booking.Id, ct);
        if (previous.Any(p => p.Status == PaymentStatuses.Submitted))
            throw Conflict("Resolve the pending payment before recording another.");
        var balance = booking.TotalAmount - previous.Where(p =>
            p.Status == PaymentStatuses.Verified).Sum(p => p.Amount);
        if (input.Amount > balance || balance <= 0)
            throw Conflict("Payment exceeds outstanding booking balance.");

        var payment = new Payment
        {
            BookingId = booking.Id, PaymentMethod = method!, Amount = input.Amount,
            Status = PaymentStatuses.Submitted,
            TransactionReference = Clean(input.TransactionReference),
            Notes = Clean(input.Notes), SubmittedAt = clock.GetUtcNow().UtcDateTime
        };
        payments.Add(payment);
        await unit.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Map(payment);
    }

    public async Task<PaymentResponse> ReviewAsync(
        long id, bool approve, string? notes, long staffId, CancellationToken ct)
    {
        if (id <= 0 || notes?.Length > 500) throw Invalid("Invalid payment review.");
        await using var tx = await unit.BeginTransactionAsync(ct);
        await ExpireAsync(ct);

        var payment = await payments.FindTrackedAsync(id, ct) ?? throw Missing();
        var booking = await db.Bookings.AsNoTracking()
            .SingleAsync(b => b.Id == payment.BookingId, ct);
        var schedule = await LockScheduleAsync(booking.ScheduleEntryId, ct);

        // Refresh tracked payment state after serialization on the schedule lock.
        await db.Entry(payment).ReloadAsync(ct);
        if (payment.Status != PaymentStatuses.Submitted)
            throw Conflict("This payment was already reviewed.");

        var now = clock.GetUtcNow().UtcDateTime;
        if (approve)
        {
            await EnsureReferenceUniqueAsync(payment, ct);
            if (schedule.Status == BookingStatuses.AwaitingReview &&
                schedule.ExpiresAt > now && schedule.StartsAt > now)
            {
                // Only full verified bank/GCash submission can confirm online holds.
                if (payment.Amount != booking.TotalAmount)
                    throw Conflict("Online reservations require full payment verification.");
                schedule.Status = BookingStatuses.Confirmed;
                schedule.ExpiresAt = null;
            }
            else if (schedule.Status == BookingStatuses.Confirmed)
            {
                var alreadyVerified = await db.Payments.Where(p => p.BookingId == booking.Id &&
                    p.Status == PaymentStatuses.Verified).SumAsync(p => (decimal?)p.Amount, ct) ?? 0m;
                if (alreadyVerified + payment.Amount > booking.TotalAmount)
                    throw Conflict("Verified payments would exceed the booking total.");
            }
            else
                throw Conflict("Expired, cancelled or unconfirmed booking cannot be approved.");

            payment.Status = PaymentStatuses.Verified;
        }
        else
        {
            payment.Status = PaymentStatuses.Rejected;
            // Rejected online proof releases its pending slot. Rejected staff
            // cash/bank record never automatically cancels a confirmed booking.
            if (schedule.Status == BookingStatuses.AwaitingReview)
            {
                schedule.Status = BookingStatuses.Expired;
                schedule.ExpiresAt = null;
            }
        }

        payment.ReviewedByStaffId = staffId;
        payment.ReviewedAt = now;
        var reviewNotes = Clean(notes);
        if (reviewNotes is not null)
            payment.Notes = string.Join("\n", new[] { payment.Notes, "Review: " + reviewNotes }
                .Where(n => !string.IsNullOrWhiteSpace(n)));
        await unit.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Map(payment);
    }

    public async Task<PaymentResponse> RecordRefundAsync(
        long id, string reference, long staffId, CancellationToken ct)
    {
        if (id <= 0 || string.IsNullOrWhiteSpace(reference) ||
            reference.Trim().Length is < 3 or > 150)
            throw Invalid("Record an external refund reference.");
        await using var tx = await unit.BeginTransactionAsync(ct);
        var payment = await payments.FindTrackedAsync(id, ct) ?? throw Missing();
        var booking = await db.Bookings.AsNoTracking()
            .SingleAsync(b => b.Id == payment.BookingId, ct);
        var schedule = await LockScheduleAsync(booking.ScheduleEntryId, ct);
        await db.Entry(payment).ReloadAsync(ct);
        if (schedule.Status != BookingStatuses.Cancelled ||
            payment.Status != PaymentStatuses.Verified)
            throw Conflict("Refund can only be recorded for a verified payment on a cancelled booking.");

        // This endpoint only records a real-world refund the operator already
        // completed. No money is sent by this system.
        payment.Status = PaymentStatuses.Refunded;
        // Keep the verification actor/time; refunds add history rather than replacing it.
        var refundNote = $"External refund reference: {reference.Trim()} (staff {staffId}, {clock.GetUtcNow():O})";
        payment.Notes = string.Join("\n", new[] { payment.Notes, refundNote }
            .Where(n => !string.IsNullOrWhiteSpace(n)));
        await unit.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        return Map(payment);
    }

    public async Task<IReadOnlyList<PendingPaymentResponse>> PendingAsync(CancellationToken ct)
    {
        var items = await (from p in db.Payments.AsNoTracking()
            join b in db.Bookings.AsNoTracking() on p.BookingId equals b.Id
            where p.Status == PaymentStatuses.Submitted
            orderby p.SubmittedAt descending
            select new PendingPaymentResponse(p.Id, b.BookingCode, b.GuestName,
                p.PaymentMethod, p.Amount, AsOffset(p.SubmittedAt),
                p.ProofStorageKey != null))
            .Take(100).ToListAsync(ct);
        return items;
    }

    public async Task<ProofContent> ReadProofAsync(long id, CancellationToken ct)
    {
        var proof = await db.Payments.AsNoTracking()
            .Where(p => p.Id == id).Select(p => p.ProofStorageKey)
            .SingleOrDefaultAsync(ct);
        if (string.IsNullOrWhiteSpace(proof)) throw Missing();
        try { return await storage.ReadAsync(proof, ct); }
        catch (FileNotFoundException) { throw Missing(); }
        catch (InvalidDataException) { throw Missing(); }
    }

    private async Task EnsureReferenceUniqueAsync(Payment payment, CancellationToken ct)
    {
        if (payment.PaymentMethod is not ("GCASH" or "BANK_TRANSFER"))
            return;
        var reference = payment.TransactionReference?.Trim();
        if (string.IsNullOrWhiteSpace(reference))
            throw Conflict("A payment reference is required before verification.");

        // Transaction-scoped advisory lock serializes the same payment reference
        // across different bookings; a read-only duplicate check alone can race.
        var key = payment.PaymentMethod + ":" + reference.ToUpperInvariant();
        _ = await db.Database.SqlQuery<int>(
            $"SELECT 1 AS \"Value\" FROM (SELECT pg_advisory_xact_lock(hashtext({key}))) AS locked")
            .SingleAsync(ct);
        var upper = reference.ToUpperInvariant();
        if (await db.Payments.AnyAsync(p => p.Id != payment.Id &&
            (p.Status == PaymentStatuses.Verified || p.Status == PaymentStatuses.Refunded) &&
            p.PaymentMethod == payment.PaymentMethod &&
            p.TransactionReference != null &&
            p.TransactionReference.Trim().ToUpper() == upper, ct))
            throw Conflict("This transaction reference has already been verified for another payment.");
    }

    private static PaymentResponse Map(Payment p) =>
        new(p.Id, p.PaymentMethod, p.Amount, p.Status,
            AsOffset(p.SubmittedAt), p.ReviewedAt is { } t ? AsOffset(t) : null,
            p.ProofStorageKey is not null, p.TransactionReference);

    private static DateTimeOffset AsOffset(DateTime t) =>
        new(DateTime.SpecifyKind(t, DateTimeKind.Utc), TimeSpan.Zero);

    private static string? Clean(string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private void RequireGuest(string code, string? token)
    {
        if (!tokens.Verify(code, token)) throw Missing();
    }

    private Task<Booking?> LookupAsync(string code, CancellationToken ct) =>
        db.Bookings.AsNoTracking().SingleOrDefaultAsync(b => b.BookingCode == code, ct);

    private async Task<Booking> FindBookingAsync(string code, CancellationToken ct) =>
        await LookupAsync(code, ct) ?? throw Missing();

    private async Task<CourtScheduleEntry> LockScheduleAsync(long id, CancellationToken ct) =>
        await db.CourtScheduleEntries.FromSqlInterpolated(
            $"SELECT * FROM court_schedule_entries WHERE id = {id} FOR UPDATE")
            .SingleAsync(ct);

    private async Task<VenueSettings> RequireVenueAsync(CancellationToken ct) =>
        await venues.GetAsync(ct) ?? throw Conflict("Venue settings unavailable.");

    private async Task ExpireAsync(CancellationToken ct) =>
        _ = await db.Database.SqlQueryRaw<int>(
            "SELECT expire_pending_schedule_entries() AS \"Value\"").SingleAsync(ct);

    private static BookingException Missing() =>
        new(BookingError.NotFound, "Payment or booking not found.");

    private static BookingException Invalid(string message) =>
        new(BookingError.InvalidInput, message);

    private static BookingException Conflict(string message) =>
        new(BookingError.Conflict, message);
}
