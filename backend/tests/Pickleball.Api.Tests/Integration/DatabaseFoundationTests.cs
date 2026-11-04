using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Settings;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

/// <summary>
/// Opt-in live tests: set PICKLEBALL_TEST_CONNECTION_STRING to an isolated
/// TEST database. Never point this to a production venue database.
/// </summary>
public sealed class DatabaseFoundationTests
{
    private static string? Connection => Environment.GetEnvironmentVariable(
        "PICKLEBALL_TEST_CONNECTION_STRING");

    private static PickleballDbContext CreateContext() =>
        new(new DbContextOptionsBuilder<PickleballDbContext>()
            .UseNpgsql(Connection!).Options);

    [Fact]
    public async Task LiveSchema_CanReadVenueAndCourtCount()
    {
        if (string.IsNullOrWhiteSpace(Connection))
            Assert.Skip("Requires a disposable PostgreSQL test database.");

        await using var db = CreateContext();
        Assert.True(await db.Database.CanConnectAsync());

        var venue = await new VenueRepository(db).GetAsync();
        Assert.NotNull(venue);
        Assert.Equal((short)1, venue.Id);

        var courts = await new CourtRepository(db).ListAsync();
        Assert.NotNull(courts);
    }

    [Fact]
    public async Task NewCourtsAppendDespiteLegacyDisplayOrdersAndRenaming()
    {
        if (string.IsNullOrWhiteSpace(Connection) ||
            Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
            Assert.Skip("Requires an explicitly enabled disposable PostgreSQL test database.");
        Assert.EndsWith("_test", new NpgsqlConnectionStringBuilder(Connection).Database);

        await using var db = CreateContext();
        await using var transaction = await db.Database.BeginTransactionAsync();
        try
        {
            var label = "__court_append_" + Guid.NewGuid().ToString("N");
            var first = new Court
            {
                CourtName = label + "_first", BaseHourlyRate = 200m,
                DisplayOrder = 1000, IsActive = true
            };
            db.Courts.Add(first);
            await db.SaveChangesAsync();
            var second = new Court
            {
                CourtName = label + "_second", BaseHourlyRate = 250m,
                DisplayOrder = -1000, IsActive = true
            };
            db.Courts.Add(second);
            await db.SaveChangesAsync();

            var repository = new CourtRepository(db);
            var firstListing = await repository.ListAsync();
            Assert.True(Array.FindIndex(firstListing.ToArray(), c => c.Id == first.Id)
                < Array.FindIndex(firstListing.ToArray(), c => c.Id == second.Id));
            Assert.Equal(firstListing.Select(c => c.Id).OrderBy(id => id),
                firstListing.Select(c => c.Id));

            first.CourtName = label + "_renamed";
            await db.SaveChangesAsync();
            var afterEdit = await repository.ListAsync();
            Assert.Equal(firstListing.Select(c => c.Id), afterEdit.Select(c => c.Id));
            Assert.Equal(label + "_renamed",
                afterEdit.Single(c => c.Id == first.Id).CourtName);
        }
        finally { await transaction.RollbackAsync(); }
    }

    [Fact]
    public async Task CourtRepository_CanCreateUpdateDeleteInsideRolledBackTransaction()
    {
        // Explicit second guard to prevent writes to a regular venue database.
        if (string.IsNullOrWhiteSpace(Connection) ||
            Environment.GetEnvironmentVariable("PICKLEBALL_TEST_MUTATIONS_ENABLED") != "1")
            Assert.Skip("Requires explicitly enabled disposable PostgreSQL mutations.");
        Assert.EndsWith("_test", new NpgsqlConnectionStringBuilder(Connection).Database);

        await using var db = CreateContext();
        var courtRepo = new CourtRepository(db);
        IUnitOfWork unit = new EfUnitOfWork(db);

        await using var tx = await unit.BeginTransactionAsync();
        try
        {
            var court = new Court
            {
                CourtName = "__test_court_" + Guid.NewGuid().ToString("N"),
                BaseHourlyRate = 250m,
                DisplayOrder = 999,
                IsActive = true
            };
            courtRepo.Add(court);
            await unit.SaveChangesAsync();

            Assert.True(court.Id > 0);
            var loaded = await courtRepo.FindAsync(court.Id);
            Assert.NotNull(loaded);
            loaded.BaseHourlyRate = 300m;
            await unit.SaveChangesAsync();

            var updated = await db.Courts.AsNoTracking()
                .SingleAsync(c => c.Id == court.Id);
            Assert.Equal(300m, updated.BaseHourlyRate);

            courtRepo.Remove(loaded);
            await unit.SaveChangesAsync();
            Assert.Null(await courtRepo.FindAsync(court.Id));
        }
        finally
        {
            await tx.RollbackAsync(); // Always roll back, including on assertion failure.
        }
    }
}
