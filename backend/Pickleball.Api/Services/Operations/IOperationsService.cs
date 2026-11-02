using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.DTOs.Operations;

namespace Pickleball.Api.Services.Operations;

public interface IOperationsService
{
    Task<CreatedBookingResponse> CreateManualAsync(
        CreateManualBookingRequest input, long staffId, CancellationToken ct);
    Task<CourtBlockResponse> BlockAsync(
        CreateCourtBlockRequest input, long staffId, CancellationToken ct);
    Task<CourtBlockResponse> UnblockAsync(long id, CancellationToken ct);
    Task<IReadOnlyList<CourtBlockResponse>> BlocksAsync(DateOnly date, CancellationToken ct);
}
