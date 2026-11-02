using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Bookings;

public interface IBookingRepository
{
    Task<Booking?> FindByCodeAsync(string bookingCode, CancellationToken cancellationToken = default);
    void Add(Booking booking);
}
