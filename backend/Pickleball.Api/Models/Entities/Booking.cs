namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.bookings.</summary>
public sealed class Booking
{
    public long Id { get; set; }
    public string BookingCode { get; set; } = null!; // DB-generated when omitted
    public long ScheduleEntryId { get; set; }
    public long? CustomerId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string? GuestPhone { get; set; }
    public string? GuestEmail { get; set; }
    public string? Notes { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal RequiredDeposit { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
