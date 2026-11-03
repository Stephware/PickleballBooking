using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Payments;

public interface IPaymentRepository
{
    Task<IReadOnlyList<Payment>> ForBookingAsync(long bookingId, CancellationToken ct);
    Task<Payment?> FindTrackedAsync(long id, CancellationToken ct);
    void Add(Payment payment);
}
