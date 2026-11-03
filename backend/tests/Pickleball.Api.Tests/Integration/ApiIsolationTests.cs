using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Pickleball.Api.Background;
using Pickleball.Api.Data;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class ApiIsolationTests
{
    [Fact]
    public async Task OfflineApiFactory_IgnoresAmbientDatabaseAndHasNoExpiryWorker()
    {
        using var factory = new AmbientDatabaseFactory();
        using var client = factory.CreateClient();
        using var scope = factory.Services.CreateScope();
        var options = scope.ServiceProvider.GetRequiredService<DbContextOptions<PickleballDbContext>>();
        Assert.DoesNotContain(options.Extensions, extension => extension.Info.IsDatabaseProvider);
        Assert.DoesNotContain(factory.Services.GetServices<IHostedService>(),
            worker => worker is PendingBookingExpiryWorker);
        var ct = TestContext.Current.CancellationToken;
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health", ct)).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/db", ct)).StatusCode);
    }

    private sealed class AmbientDatabaseFactory : IsolatedApiFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services => services.AddDbContext<PickleballDbContext>(options =>
                options.UseNpgsql("Host=localhost;Port=1;Database=ambient_venue;Username=invalid")));
            base.ConfigureWebHost(builder);
        }
    }
}
