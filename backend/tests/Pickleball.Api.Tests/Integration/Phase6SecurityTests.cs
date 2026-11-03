using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

/// <summary>Authorization/CSRF tests do not need configured PostgreSQL.</summary>
public sealed class Phase6SecurityTests(IsolatedApiFactory app)
    : IClassFixture<IsolatedApiFactory>
{
    [Theory]
    [InlineData("/api/v1/admin/payments/pending")]
    [InlineData("/api/v1/admin/payments/1/proof")]
    [InlineData("/api/v1/admin/payments/bookings/PB-1111111111111111")]
    [InlineData("/api/v1/admin/operations/blocks?date=2026-11-04")]
    public async Task SensitiveAdminOperations_DenyAnonymous(string path)
    {
        using var client = app.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PaymentReviewMutation_DeniesAnonymous()
    {
        using var client = app.CreateClient();
        var response = await client.PostAsync("/api/v1/admin/payments/1/approve",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ManualBookingMutation_DeniesAnonymous()
    {
        using var client = app.CreateClient();
        var response = await client.PostAsync("/api/v1/admin/operations/manual-bookings",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GuestPaymentRead_RequiresBearerToken()
    {
        using var client = app.CreateClient();
        var response = await client.GetAsync(
            "/api/v1/bookings/PB-1111111111111111/payments");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
