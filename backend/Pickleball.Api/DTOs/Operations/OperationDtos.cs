using System.ComponentModel.DataAnnotations;
using Pickleball.Api.DTOs.Bookings;

namespace Pickleball.Api.DTOs.Operations;

public sealed class CreateManualBookingRequest : CreateBookingRequest
{
    [Required] public string Channel { get; set; } = "WALK_IN";
}

public sealed class CreateCourtBlockRequest
{
    [Range(1, long.MaxValue)] public long CourtId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartsAt { get; set; }
    public TimeOnly EndsAt { get; set; }
    [Required, StringLength(300, MinimumLength = 3)]
    public string Reason { get; set; } = "";
}

public sealed record CourtBlockResponse(
    long Id, long CourtId, DateTimeOffset StartsAtUtc,
    DateTimeOffset EndsAtUtc, string Status, string Reason, long? CreatedByStaffId);
