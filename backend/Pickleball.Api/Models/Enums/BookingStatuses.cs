namespace Pickleball.Api.Models.Enums;

/// <summary>String constants match SQL check constraints (not persisted .NET enums).</summary>
public static class BookingStatuses
{
    public const string Held = "HELD";
    public const string AwaitingReview = "AWAITING_REVIEW";
    public const string Confirmed = "CONFIRMED";
    public const string Completed = "COMPLETED";
    public const string Cancelled = "CANCELLED";
    public const string Expired = "EXPIRED";
    public const string Blocked = "BLOCKED";

    public static readonly string[] Active = [Held, AwaitingReview, Confirmed, Completed, Blocked];
}

public static class ScheduleEntryTypes
{
    public const string Booking = "BOOKING";
    public const string Block = "BLOCK";
}

public static class PaymentStatuses
{
    public const string Submitted = "SUBMITTED";
    public const string Verified = "VERIFIED";
    public const string Rejected = "REJECTED";
    public const string Refunded = "REFUNDED";
}
