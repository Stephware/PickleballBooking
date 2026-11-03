using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Payments;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Payments;
using Pickleball.Api.Storage;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class PaymentIntegrityTests
{
    [Theory]
    [InlineData(PaymentStatuses.Verified, "transfer-123")]
    [InlineData(PaymentStatuses.Refunded, "transfer-123")]
    [InlineData(PaymentStatuses.Verified, "  transfer-123  ")]
    public async Task PreviouslyVerifiedTransferReference_CannotBeReused(
        string priorStatus, string priorReference)
    {
        await using var fixture = await PaymentFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        var prior = await fixture.AddPaymentAsync(0, priorStatus, priorReference);
        var candidate = await fixture.AddPaymentAsync(1, PaymentStatuses.Submitted, "TRANSFER-123");

        var error = await Assert.ThrowsAsync<BookingException>(() =>
            fixture.Service.ReviewAsync(candidate.Id, true, null, fixture.Staff.Id, ct));

        Assert.Equal(BookingError.Conflict, error.Error);
        fixture.Db.ChangeTracker.Clear();
        Assert.Equal(PaymentStatuses.Submitted,
            (await fixture.Db.Payments.SingleAsync(p => p.Id == candidate.Id, ct)).Status);
        Assert.Equal(priorStatus,
            (await fixture.Db.Payments.SingleAsync(p => p.Id == prior.Id, ct)).Status);
    }

    [Fact]
    public async Task ReviewAndRefund_PreserveOriginalPaymentAndVerificationHistory()
    {
        await using var fixture = await PaymentFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        var payment = await fixture.AddPaymentAsync(0, PaymentStatuses.Submitted, "history-123");
        payment.Notes = "Received at front desk";
        await fixture.Db.SaveChangesAsync(ct);
        await fixture.Service.ReviewAsync(payment.Id, true, "Receipt checked", fixture.Staff.Id, ct);
        fixture.Db.ChangeTracker.Clear();
        var reviewed = await fixture.Db.Payments.SingleAsync(p => p.Id == payment.Id, ct);
        var verifiedAt = reviewed.ReviewedAt;
        var verifiedBy = reviewed.ReviewedByStaffId;
        var schedule = await fixture.Db.CourtScheduleEntries.SingleAsync(
            s => s.Id == fixture.Bookings[0].ScheduleEntryId, ct);
        schedule.Status = BookingStatuses.Cancelled;
        await fixture.Db.SaveChangesAsync(ct);

        await fixture.Service.RecordRefundAsync(payment.Id, "refund-456", fixture.RefundStaff.Id, ct);
        fixture.Db.ChangeTracker.Clear();
        var refunded = await fixture.Db.Payments.SingleAsync(p => p.Id == payment.Id, ct);

        Assert.Equal(PaymentStatuses.Refunded, refunded.Status);
        Assert.Equal(verifiedAt, refunded.ReviewedAt);
        Assert.Equal(verifiedBy, refunded.ReviewedByStaffId);
        Assert.Contains("Received at front desk", refunded.Notes);
        Assert.Contains("Receipt checked", refunded.Notes);
        Assert.Contains("refund-456", refunded.Notes);
        Assert.Contains($"staff {fixture.RefundStaff.Id}", refunded.Notes);
        Assert.Equal("history-123", refunded.TransactionReference);
    }

    [Fact]
    public async Task PaidProofUnderReview_DoesNotExpire_AndCanBeApprovedAfterGameStarts()
    {
        await using var fixture = await PaymentFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        var payment = await fixture.AddPaymentAsync(0, PaymentStatuses.Submitted, "late-review-123");
        var schedule = await fixture.Db.CourtScheduleEntries.SingleAsync(
            s => s.Id == fixture.Bookings[0].ScheduleEntryId, ct);
        schedule.Status = BookingStatuses.AwaitingReview;
        schedule.StartsAt = DateTime.UtcNow.AddHours(-2);
        schedule.EndsAt = DateTime.UtcNow.AddHours(-1);
        schedule.ExpiresAt = null;
        await fixture.Db.SaveChangesAsync(ct);

        // No timer or concurrent hold cleanup can expire a submitted proof.
        _ = await fixture.Db.Database.SqlQueryRaw<int>(
            "SELECT expire_pending_schedule_entries() AS \"Value\"").SingleAsync(ct);
        fixture.Db.ChangeTracker.Clear();
        var afterSweep = await fixture.Db.CourtScheduleEntries.AsNoTracking()
            .SingleAsync(s => s.Id == schedule.Id, ct);
        Assert.Equal(BookingStatuses.AwaitingReview, afterSweep.Status);
        Assert.Null(afterSweep.ExpiresAt);

        var verified = await fixture.Service.ReviewAsync(payment.Id, true,
            "Verified after game start", fixture.Staff.Id, ct);
        Assert.Equal(PaymentStatuses.Verified, verified.Status);
        fixture.Db.ChangeTracker.Clear();
        Assert.Equal(BookingStatuses.Confirmed, (await fixture.Db.CourtScheduleEntries
            .AsNoTracking().SingleAsync(s => s.Id == schedule.Id, ct)).Status);
    }

    [Fact]
    public async Task StaffRejection_ReleasesProtectedPendingCourtExplicitly()
    {
        await using var fixture = await PaymentFixture.CreateAsync();
        var ct = TestContext.Current.CancellationToken;
        var payment = await fixture.AddPaymentAsync(0, PaymentStatuses.Submitted, "rejected-proof-123");
        var schedule = await fixture.Db.CourtScheduleEntries.SingleAsync(
            s => s.Id == fixture.Bookings[0].ScheduleEntryId, ct);
        schedule.Status = BookingStatuses.AwaitingReview;
        schedule.ExpiresAt = null;
        await fixture.Db.SaveChangesAsync(ct);

        var rejected = await fixture.Service.ReviewAsync(payment.Id, false,
            "No matching external transfer", fixture.Staff.Id, ct);
        Assert.Equal(PaymentStatuses.Rejected, rejected.Status);
        fixture.Db.ChangeTracker.Clear();
        var afterReview = await fixture.Db.CourtScheduleEntries.AsNoTracking()
            .SingleAsync(s => s.Id == schedule.Id, ct);
        Assert.Equal(BookingStatuses.Expired, afterReview.Status);
        Assert.Null(afterReview.ExpiresAt);
    }

    private sealed class PaymentFixture : IAsyncDisposable
    {
        public required PickleballDbContext Db { get; init; }
        public required StaffUser Staff { get; init; }
        public required StaffUser RefundStaff { get; init; }
        public required Court Court { get; init; }
        public required Booking[] Bookings { get; init; }
        public required PaymentService Service { get; init; }

        public static async Task<PaymentFixture> CreateAsync()
        {
            var connection = Environment.GetEnvironmentVariable("PICKLEBALL_TEST_CONNECTION_STRING");
            if (string.IsNullOrWhiteSpace(connection) ||
                Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
                Assert.Skip("Requires an explicitly enabled disposable PostgreSQL test database.");
            var settings = new NpgsqlConnectionStringBuilder(connection);
            Assert.EndsWith("_test", settings.Database);
            var ct = TestContext.Current.CancellationToken;
            var db = new PickleballDbContext(new DbContextOptionsBuilder<PickleballDbContext>()
                .UseNpgsql(connection).Options);
            var suffix = Guid.NewGuid().ToString("N");
            var staff = new StaffUser { FullName = "Payment test", Email = suffix + "@example.test",
                PasswordHash = "test-only-not-a-login", Role = "MANAGER", IsActive = true };
            var court = new Court { CourtName = "__payment_test_" + suffix,
                BaseHourlyRate = 250m, IsActive = true };
            var refundStaff = new StaffUser { FullName = "Refund test", Email = suffix + "-refund@example.test",
                PasswordHash = "test-only-not-a-login", Role = "MANAGER", IsActive = true };
            db.AddRange(staff, refundStaff, court);
            await db.SaveChangesAsync(ct);
            var bookings = new Booking[2];
            for (var i = 0; i < bookings.Length; i++)
            {
                var start = DateTime.UtcNow.Date.AddDays(5).AddHours(i + 1);
                var schedule = new CourtScheduleEntry { CourtId = court.Id,
                    EntryType = ScheduleEntryTypes.Booking, Status = BookingStatuses.Confirmed,
                    StartsAt = start, EndsAt = start.AddHours(1), CreatedByStaffId = staff.Id };
                db.Add(schedule);
                await db.SaveChangesAsync(ct);
                bookings[i] = new Booking { ScheduleEntryId = schedule.Id,
                    GuestName = "Synthetic test guest", GuestPhone = "test-only", TotalAmount = 250m };
                db.Add(bookings[i]);
                await db.SaveChangesAsync(ct);
            }
            var config = new ConfigurationBuilder().Build();
            return new() { Db = db, Staff = staff, RefundStaff = refundStaff, Court = court, Bookings = bookings,
                Service = new(db, new PaymentRepository(db), new EfUnitOfWork(db),
                    new VenueRepository(db), new GuestBookingTokens(config),
                    new LocalProofStorage(config), TimeProvider.System) };
        }

        public async Task<Payment> AddPaymentAsync(int booking, string status, string reference)
        {
            var payment = new Payment { BookingId = Bookings[booking].Id,
                PaymentMethod = "GCASH", Amount = 250m, Status = status,
                TransactionReference = reference, SubmittedAt = DateTime.UtcNow };
            Db.Add(payment);
            await Db.SaveChangesAsync(TestContext.Current.CancellationToken);
            return payment;
        }

        public async ValueTask DisposeAsync()
        {
            // Delete only this fixture's synthetic rows; never reset shared schema/data.
            var ids = Bookings.Select(b => b.Id).ToArray();
            await Db.Payments.Where(p => ids.Contains(p.BookingId)).ExecuteDeleteAsync(CancellationToken.None);
            await Db.Bookings.Where(b => ids.Contains(b.Id)).ExecuteDeleteAsync(CancellationToken.None);
            await Db.CourtScheduleEntries.Where(s => s.CourtId == Court.Id).ExecuteDeleteAsync(CancellationToken.None);
            await Db.Courts.Where(c => c.Id == Court.Id).ExecuteDeleteAsync(CancellationToken.None);
            await Db.StaffUsers.Where(s => s.Id == Staff.Id || s.Id == RefundStaff.Id)
                .ExecuteDeleteAsync(CancellationToken.None);
            await Db.DisposeAsync();
        }
    }
}
