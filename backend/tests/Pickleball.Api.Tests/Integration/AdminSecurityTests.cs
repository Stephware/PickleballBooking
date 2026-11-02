using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

/// <summary>No local database needed for authorization/CSRF boundary tests.</summary>
public sealed class AdminSecurityTests(WebApplicationFactory<Program> app)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Theory]
    [InlineData("/api/v1/admin/courts")]
    [InlineData("/api/v1/admin/venue")]
    [InlineData("/api/v1/admin/staff")]
    [InlineData("/api/v1/admin/auth/me")]
    public async Task ProtectedGet_RejectsAnonymous(string path)
    {
        using var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync(path)).StatusCode);
    }

    [Fact]
    public async Task LoginWithoutCsrf_IsRejectedBeforePasswordLookup()
    {
        using var client = app.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/admin/auth/login",
            new { email = "staff@example.com", password = "not-used" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PublicCsrfEndpoint_IssuesTokenAndAntiforgeryCookie()
    {
        using var client = app.CreateClient();
        var response = await client.GetAsync("/api/v1/admin/auth/csrf");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("pickleball.csrf", string.Join(";",
            response.Headers.GetValues("Set-Cookie")));
        var result = await response.Content.ReadFromJsonAsync<CsrfResponse>();
        Assert.NotNull(result?.Token);
        Assert.NotEmpty(result.Token);
    }

    private sealed record CsrfResponse(string Token);
}
