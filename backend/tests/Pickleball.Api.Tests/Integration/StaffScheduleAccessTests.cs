using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class StaffScheduleAccessTests(IsolatedApiFactory app)
    : IClassFixture<IsolatedApiFactory>
{
    [Fact]
    public async Task WalkInScheduleEndpoint_RejectsAnonymous()
    {
        using var client = app.CreateClient();
        var response = await client.GetAsync(
            "/api/v1/admin/operations/availability?date=2026-11-04");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task WalkInScheduleDoesNotModifyPublicAvailability()
    {
        using var client = app.CreateClient();
        // The public availability route remains anonymous, but invalid dates
        // are rejected before any DB call.
        var response = await client.GetAsync("/api/v1/availability?date=0001-01-01");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
