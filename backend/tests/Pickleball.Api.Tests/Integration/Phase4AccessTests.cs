using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Pickleball.Api.DTOs.Availability;
using Pickleball.Api.Services.Availability;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class Phase4AccessTests(IsolatedApiFactory factory)
    : IClassFixture<IsolatedApiFactory>
{
    [Fact]
    public async Task PricingRuleRead_RequiresAuthentication()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/v1/admin/pricing/rules")).StatusCode);
    }

    [Fact]
    public async Task PricingRuleWrite_DeniesAnonymous()
    {
        using var client = factory.CreateClient();
        var response = await client.PostAsync("/api/v1/admin/pricing/rules",
            new StringContent("{}", System.Text.Encoding.UTF8, "application/json"));
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AvailabilityGet_RejectsDefaultDateBeforeDatabaseAccess()
    {
        // Override the service so the test is independent from local DB secrets.
        using var app = factory.WithWebHostBuilder(web => web.ConfigureTestServices(
            services => services.AddScoped<IAvailabilityService>(_ => new FakeAvailabilityService())));
        using var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.GetAsync("/api/v1/availability?date=0001-01-01")).StatusCode);
    }

    [Fact]
    public async Task PublicPricingQuote_RejectsNonPositiveCourt()
    {
        using var app = factory.WithWebHostBuilder(web => web.ConfigureTestServices(
            services => services.AddScoped<IAvailabilityService, FakeAvailabilityService>()));
        using var client = app.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.GetAsync(
                "/api/v1/pricing/quote?date=2026-11-03&courtId=0&startsAt=09:00")).StatusCode);
    }

    private sealed class FakeAvailabilityService : IAvailabilityService
    {
        public Task<AvailabilityDayResponse> GetDayAsync(
            DateOnly date, long? courtId, CancellationToken ct) =>
            throw new InvalidOperationException("Invalid input must be rejected before service use.");

        public Task<PriceQuoteResponse?> GetQuoteAsync(
            DateOnly date, long courtId, TimeOnly start, CancellationToken ct) =>
            throw new InvalidOperationException("Invalid input must be rejected before service use.");
    }
}
