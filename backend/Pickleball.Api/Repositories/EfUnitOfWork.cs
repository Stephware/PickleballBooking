using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Pickleball.Api.Data;

namespace Pickleball.Api.Repositories;

public sealed class EfUnitOfWork(PickleballDbContext db) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public Task<IDbContextTransaction> BeginTransactionAsync(
        CancellationToken cancellationToken = default) =>
        db.Database.BeginTransactionAsync(cancellationToken);
}
