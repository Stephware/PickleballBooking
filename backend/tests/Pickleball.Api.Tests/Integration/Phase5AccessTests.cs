using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.Services.Bookings;
using Xunit;

namespace Pickleball.Api.Tests.Integration;

public sealed class Phase5AccessTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GuestBooking_InvalidJsonBody_IsRejected()
    {
        using var client = factory.CreateClient();
        var result = await client.PostAsJsonAsync("/api/v1/bookings", new
        {
            idempotencyKey = Guid.Empty, courtId = -1, guestName = ""
        });
        Assert.Equal(HttpStatusCode.BadRequest, result.StatusCode);
    }

    [Fact]
    public async Task GuestAccessWithoutToken_IsNotFound()
    {
        using var testApp = factory.WithWebHostBuilder(b => b.ConfigureTestServices(
            s => s.AddScoped<IBookingService>(_ => new FakeBookingService())));
        using var client = testApp.CreateClient();
        Assert.Equal(HttpStatusCode.NotFound,
            (await client.GetAsync("/api/v1/bookings/PB-0000000000000000")).StatusCode);
    }

    [Fact]
    public async Task AdminBookingListing_IsProtected()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/v1/admin/bookings?date=2026-11-03")).StatusCode);
    }

    [Fact]
    public async Task AdminConfirmationWithoutCsrf_IsRejected()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.BadRequest,
            (await client.PostAsync(
                "/api/v1/admin/bookings/PB-0000000000000000/confirm", null)).StatusCode);
    }

    private sealed class FakeBookingService : IBookingService
    {
        public Task<CreatedBookingResponse> CreateAsync(CreateBookingRequest request,
            CancellationToken ct) => throw new NotSupportedException();

        public Task<BookingResponse> GetGuestAsync(string code, string? token, CancellationToken ct) =>
            throw new BookingException(BookingError.NotFound, "Booking not found.");

        public Task<BookingResponse> CancelGuestAsync(string code, string? token,
            CancelBookingRequest request, CancellationToken ct) => throw new NotSupportedException();

        public Task<BookingResponse> ConfirmStaffAsync(string code, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<BookingResponse> CancelStaffAsync(string code, CancelBookingRequest request,
            CancellationToken ct) => throw new NotSupportedException();

        public Task<IReadOnlyList<AdminBookingResponse>> ListStaffAsync(DateOnly date,
            CancellationToken ct) => throw new NotSupportedException();
    }
}
