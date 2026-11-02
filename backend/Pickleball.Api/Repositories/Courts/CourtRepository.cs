using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Courts;

public sealed class CourtRepository(PickleballDbContext db) : ICourtRepository
{
    public async Task<IReadOnlyList<Court>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.Courts.AsNoTracking()
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);

    // Tracked entity; later CourtService may update its properties.
    public Task<Court?> FindAsync(long id, CancellationToken cancellationToken = default) =>
        db.Courts.SingleOrDefaultAsync(c => c.Id == id, cancellationToken);

    public void Add(Court court) => db.Courts.Add(court);
    public void Remove(Court court) => db.Courts.Remove(court);
}
