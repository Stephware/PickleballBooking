using Microsoft.AspNetCore.Http;
using Pickleball.Api.DTOs.Payments;
using Pickleball.Api.Storage;

namespace Pickleball.Api.Services.Payments;

public interface IPaymentService
{
    Task<PaymentResponse> SubmitGuestAsync(string code, string? token,
        SubmitPaymentProofRequest request, CancellationToken ct);
    Task<PaymentSummaryResponse> GuestSummaryAsync(string code, string? token,
        CancellationToken ct);
    Task<PaymentSummaryResponse> StaffSummaryAsync(string code, CancellationToken ct);
    Task<PaymentResponse> RecordStaffAsync(string code, RecordPaymentRequest request,
        CancellationToken ct);
    Task<PaymentResponse> ReviewAsync(long id, bool approve, string? notes,
        long staffId, CancellationToken ct);
    Task<PaymentResponse> RecordRefundAsync(long id, string reference,
        long staffId, CancellationToken ct);
    Task<IReadOnlyList<PendingPaymentResponse>> PendingAsync(CancellationToken ct);
    Task<ProofContent> ReadProofAsync(long id, CancellationToken ct);
}

public sealed record PendingPaymentResponse(
    long PaymentId, string BookingCode, string GuestName,
    string PaymentMethod, decimal Amount, DateTimeOffset SubmittedAtUtc,
    bool HasProof, DateTimeOffset StartsAtUtc, string BookingStatus);
