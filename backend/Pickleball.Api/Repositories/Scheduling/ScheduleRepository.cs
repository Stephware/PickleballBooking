using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;

namespace Pickleball.Api.Repositories.Scheduling;

public sealed class ScheduleRepository(PickleballDbContext db) : IScheduleRepository
{
    public async Task<IReadOnlyList<CourtScheduleEntry>> GetActiveOverlapsAsync(
        long courtId, DateTime startUtc, DateTime endUtc,
        CancellationToken cancellationToken = default)
    {
        // This query provides a snapshot for availability. An actual reservation
        // MUST still rely on the PostgreSQL exclusion constraint to handle races.
        return await db.CourtScheduleEntries.AsNoTracking()
            .Where(e => e.CourtId == courtId
                && BookingStatuses.Active.Contains(e.Status)
                && e.StartsAt < endUtc && e.EndsAt > startUtc)
            .OrderBy(e => e.StartsAt).ToListAsync(cancellationToken);
    }

    public void Add(CourtScheduleEntry entry) => db.CourtScheduleEntries.Add(entry);
}
