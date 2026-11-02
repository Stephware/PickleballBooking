using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Pickleball.Api.DTOs.System;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class ApiFoundationTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task HealthEndpoint_ReturnsSuccess()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task SystemStatusEndpoint_ReturnsExpectedResponse()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/system/status");
        var body = await response.Content.ReadFromJsonAsync<ApiStatusResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Pickleball.Api", body.Service);
        Assert.Equal("healthy", body.Status);
        Assert.True(body.UtcNow <= DateTimeOffset.UtcNow.AddSeconds(5));
    }

    [Fact]
    public async Task BrowserFrontendCors_AllowsConfiguredDevelopmentOrigin()
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/system/status");
        request.Headers.TryAddWithoutValidation("Origin", "http://localhost:3000");
        request.Headers.TryAddWithoutValidation("Access-Control-Request-Method", "GET");

        using var response = await client.SendAsync(request);

        Assert.True(response.IsSuccessStatusCode);
        Assert.True(response.Headers.TryGetValues("Access-Control-Allow-Origin", out var origins));
        Assert.Contains("http://localhost:3000", origins);
    }
}
