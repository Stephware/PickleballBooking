using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class DatabaseHealthTests(IsolatedApiFactory factory)
    : IClassFixture<IsolatedApiFactory>
{
    [Fact]
    public async Task ProcessHealth_DoesNotDependOnDatabaseConnection()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
    }

    [Fact]
    public async Task DatabaseHealth_WithoutConfiguredConnection_IsUnhealthy()
    {
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/health/db");
        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}
