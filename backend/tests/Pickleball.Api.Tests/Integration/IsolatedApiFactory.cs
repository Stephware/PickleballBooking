using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Pickleball.Api.Background;
using Pickleball.Api.Data;

namespace Pickleball.Api.Tests.Integration;

public class IsolatedApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
            new Dictionary<string, string?> { ["ConnectionStrings:Pickleball"] = null }));
        builder.ConfigureTestServices(services =>
        {
            // Remove captured ambient/user-secret provider options before the host starts.
            services.RemoveAll<PickleballDbContext>();
            services.RemoveAll<DbContextOptions>();
            services.RemoveAll<DbContextOptions<PickleballDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<PickleballDbContext>>();
            services.AddDbContext<PickleballDbContext>(_ => { });
            foreach (var worker in services.Where(service => service.ServiceType == typeof(IHostedService) &&
                         service.ImplementationType == typeof(PendingBookingExpiryWorker)).ToArray())
                services.Remove(worker);
        });
    }
}
