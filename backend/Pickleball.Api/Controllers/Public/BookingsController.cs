using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.Services.Bookings;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/bookings")]
public sealed class BookingsController(IBookingService bookings) : ControllerBase
{
    [HttpPost, EnableRateLimiting("guest-booking")]
    public async Task<IActionResult> Create(
        CreateBookingRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try
        {
            var saved = await bookings.CreateAsync(request, ct);
            return StatusCode(StatusCodes.Status201Created, saved);
        }
        catch (BookingException e) { return ApiError(e); }
    }

    [HttpGet("{code}"), EnableRateLimiting("guest-booking-read")]
    public async Task<IActionResult> Get(
        string code, [FromHeader(Name = "X-Booking-Token")] string? token,
        CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await bookings.GetGuestAsync(code, token, ct)); }
        catch (BookingException e) { return ApiError(e); }
    }

    [HttpPost("{code}/cancel"), EnableRateLimiting("guest-booking")]
    public async Task<IActionResult> Cancel(
        string code, [FromHeader(Name = "X-Booking-Token")] string? token,
        CancelBookingRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await bookings.CancelGuestAsync(code, token, request, ct)); }
        catch (BookingException e) { return ApiError(e); }
    }

    internal static IActionResult ApiError(BookingException e)
    {
        var status = e.Error switch
        {
            BookingError.InvalidInput => StatusCodes.Status400BadRequest,
            BookingError.NotFound or BookingError.InvalidToken => StatusCodes.Status404NotFound,
            BookingError.Conflict or BookingError.Unavailable => StatusCodes.Status409Conflict,
            _ => StatusCodes.Status500InternalServerError
        };
        return new ObjectResult(new { error = e.Message }) { StatusCode = status };
    }
}
