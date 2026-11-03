using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Scheduling;

public interface IScheduleRepository
{
    Task<IReadOnlyList<CourtScheduleEntry>> GetActiveOverlapsAsync(
        long courtId, DateTime startUtc, DateTime endUtc,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CourtScheduleEntry>> ListActiveInRangeAsync(
        DateTime fromUtc, DateTime toUtc, CancellationToken cancellationToken = default);
    void Add(CourtScheduleEntry entry);
}
