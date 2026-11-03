using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class ResponseSecurityTests(IsolatedApiFactory app)
    : IClassFixture<IsolatedApiFactory>
{
    [Theory]
    [InlineData("/health")]
    [InlineData("/api/v1/admin/courts")]
    public async Task ResponsesPreventFramingSniffingAndCaching(string path)
    {
        using var client = app.CreateClient();
        using var response = await client.GetAsync(path);
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.True(response.Headers.CacheControl?.NoStore);
        Assert.Equal("no-referrer", response.Headers.GetValues("Referrer-Policy").Single());
    }
}
