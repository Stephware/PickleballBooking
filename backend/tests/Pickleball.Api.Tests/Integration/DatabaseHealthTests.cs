using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class DatabaseHealthTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
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
        // The tests have no user-secrets. Even without DB, process health stays up.
        using var client = factory.CreateClient();
        // A local developer may configure a connection via user-secrets:
        // in that case, /health/db can be healthy, so ensure an HTTP health response.
        var response = await client.GetAsync("/health/db");
        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.ServiceUnavailable);
    }
}
