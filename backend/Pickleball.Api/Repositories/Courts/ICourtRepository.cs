using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Repositories.Courts;

public interface ICourtRepository
{
    Task<IReadOnlyList<Court>> ListAsync(CancellationToken cancellationToken = default);
    Task<Court?> FindAsync(long id, CancellationToken cancellationToken = default);
    void Add(Court court);
    void Remove(Court court);
}
