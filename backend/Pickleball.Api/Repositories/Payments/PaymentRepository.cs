using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Payments;

public sealed class PaymentRepository(PickleballDbContext db) : IPaymentRepository
{
    public async Task<IReadOnlyList<Payment>> ForBookingAsync(
        long bookingId, CancellationToken ct) =>
        await db.Payments.AsNoTracking()
            .Where(p => p.BookingId == bookingId)
            .OrderByDescending(p => p.SubmittedAt)
            .ThenByDescending(p => p.Id).ToListAsync(ct);

    public Task<Payment?> FindTrackedAsync(long id, CancellationToken ct) =>
        db.Payments.SingleOrDefaultAsync(p => p.Id == id, ct);

    public void Add(Payment payment) => db.Payments.Add(payment);
}
