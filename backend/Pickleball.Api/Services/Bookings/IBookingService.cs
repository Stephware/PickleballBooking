using Pickleball.Api.DTOs.Bookings;

namespace Pickleball.Api.Services.Bookings;

public interface IBookingService
{
    Task<CreatedBookingResponse> CreateAsync(CreateBookingRequest request, CancellationToken ct);
    Task<BookingResponse> GetGuestAsync(string code, string? token, CancellationToken ct);
    Task<BookingResponse> CancelGuestAsync(string code, string? token,
        CancelBookingRequest request, CancellationToken ct);
    Task<BookingResponse> ConfirmStaffAsync(string code, CancellationToken ct);
    Task<BookingResponse> CancelStaffAsync(string code,
        CancelBookingRequest request, CancellationToken ct);
    Task<IReadOnlyList<AdminBookingResponse>> ListStaffAsync(
        DateOnly date, CancellationToken ct);
}
