using Pickleball.Api.DTOs.Courts;

namespace Pickleball.Api.Services.Courts;

public interface ICourtService
{
    Task<IReadOnlyList<CourtResponse>> ListAsync(bool activeOnly, CancellationToken ct);
    Task<CourtResponse?> GetAsync(long id, CancellationToken ct);
    Task<CourtResponse> CreateAsync(SaveCourtRequest request, CancellationToken ct);
    Task<CourtResponse?> UpdateAsync(long id, SaveCourtRequest request, CancellationToken ct);
}
