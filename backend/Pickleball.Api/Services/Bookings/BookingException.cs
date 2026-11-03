namespace Pickleball.Api.Services.Bookings;

public enum BookingError
{
    InvalidInput,
    NotFound,
    Conflict,
    Unavailable,
    InvalidToken
}

public sealed class BookingException(BookingError error, string message)
    : Exception(message)
{
    public BookingError Error { get; } = error;
}
