using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Bookings;

public sealed class BookingRepository(PickleballDbContext db) : IBookingRepository
{
    public Task<Booking?> FindByCodeAsync(
        string bookingCode, CancellationToken cancellationToken = default) =>
        db.Bookings.AsNoTracking()
            .SingleOrDefaultAsync(b => b.BookingCode == bookingCode, cancellationToken);

    public void Add(Booking booking) => db.Bookings.Add(booking);
}
