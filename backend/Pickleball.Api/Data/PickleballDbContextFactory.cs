using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Pickleball.Api.Data;

/// <summary>
/// Used by dotnet ef design-time commands. Does not connect or change database
/// unless an explicitly requested EF command does so.
/// </summary>
public sealed class PickleballDbContextFactory : IDesignTimeDbContextFactory<PickleballDbContext>
{
    public PickleballDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddUserSecrets<PickleballDbContextFactory>(optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connection = configuration.GetConnectionString("Pickleball");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException(
                "ConnectionStrings:Pickleball must be configured via user-secrets or an environment variable.");

        var options = new DbContextOptionsBuilder<PickleballDbContext>()
            .UseNpgsql(connection)
            .Options;
        return new PickleballDbContext(options);
    }
}
