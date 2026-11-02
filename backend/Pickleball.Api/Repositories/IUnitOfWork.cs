using Microsoft.EntityFrameworkCore.Storage;

namespace Pickleball.Api.Repositories;

/// <summary>
/// Services coordinate saves and transactions across repositories.
/// No repository should silently SaveChanges itself.
/// </summary>
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<IDbContextTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default);
}
