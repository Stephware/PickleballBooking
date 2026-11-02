namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.payments.</summary>
public sealed class Payment
{
    public long Id { get; set; }
    public long BookingId { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "SUBMITTED";
    public string? TransactionReference { get; set; }
    public string? ProofStorageKey { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public long? ReviewedByStaffId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
