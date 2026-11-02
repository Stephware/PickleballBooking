using System.ComponentModel.DataAnnotations;

namespace Pickleball.Api.DTOs.Bookings;

/// <summary>IdempotencyKey must be a freshly generated UUID v4 per intended booking.</summary>
public sealed class CreateBookingRequest
{
    public Guid IdempotencyKey { get; set; }

    [Range(1, long.MaxValue)]
    public long CourtId { get; set; }

    public DateOnly Date { get; set; }
    public TimeOnly StartsAt { get; set; }
    public TimeOnly EndsAt { get; set; }

    [Required, StringLength(150, MinimumLength = 1)]
    public string GuestName { get; set; } = string.Empty;

    [MaxLength(32)]
    public string? GuestPhone { get; set; }

    [EmailAddress, MaxLength(254)]
    public string? GuestEmail { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public sealed record BookingResponse(
    string BookingCode, long CourtId, string Status,
    DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc,
    decimal TotalAmount, string Currency,
    DateTimeOffset? ExpiresAtUtc);

/// <summary>Only POST creates/replays return the bearer secret.</summary>
public sealed record CreatedBookingResponse(BookingResponse Booking, string AccessToken);

public sealed class CancelBookingRequest
{
    [MaxLength(300)]
    public string? Reason { get; set; }
}

public sealed record AdminBookingResponse(
    string BookingCode, long CourtId, string Status,
    DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc,
    string GuestName, string? GuestPhone, string? GuestEmail,
    decimal TotalAmount, DateTimeOffset? ExpiresAtUtc);
