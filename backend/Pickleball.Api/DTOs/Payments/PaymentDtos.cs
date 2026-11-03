using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Pickleball.Api.DTOs.Payments;

public sealed class SubmitPaymentProofRequest
{
    [Required] public string PaymentMethod { get; set; } = "";
    [Range(typeof(decimal), "0.01", "99999999.99")]
    public decimal Amount { get; set; }
    [MaxLength(150)] public string? TransactionReference { get; set; }
    [Required] public IFormFile? Proof { get; set; }
}

public sealed class RecordPaymentRequest
{
    [Required] public string PaymentMethod { get; set; } = "";
    [Range(typeof(decimal), "0.01", "99999999.99")]
    public decimal Amount { get; set; }
    [MaxLength(150)] public string? TransactionReference { get; set; }
    [MaxLength(500)] public string? Notes { get; set; }
}

public sealed class ReviewPaymentRequest
{
    [MaxLength(500)] public string? Notes { get; set; }
}

public sealed class RecordRefundRequest
{
    [Required, MinLength(3), MaxLength(150)]
    public string RefundReference { get; set; } = "";
}

public sealed record PaymentResponse(
    long Id, string PaymentMethod, decimal Amount, string Status,
    DateTimeOffset SubmittedAtUtc, DateTimeOffset? ReviewedAtUtc,
    bool HasProof, string? TransactionReference);

public sealed record PaymentSummaryResponse(
    string BookingCode, string BookingStatus, decimal BookingTotal, decimal VerifiedTotal,
    decimal BalanceDue, string Currency, IReadOnlyList<PaymentResponse> Payments);
