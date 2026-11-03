using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class ProductionStartupTests
{
    [Fact]
    public void ProductionRefusesMissingPersistentSecurityConfiguration()
    {
        using var app = new IsolatedApiFactory().WithWebHostBuilder(web =>
            web.UseEnvironment("Production"));
        Assert.ThrowsAny<Exception>(() => app.CreateClient());
    }
}
