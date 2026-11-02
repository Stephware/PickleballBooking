using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Pickleball.Api.DTOs.Payments;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Payments;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/bookings/{code}/payments")]
public sealed class PaymentsController(IPaymentService service) : ControllerBase
{
    [HttpPost, Consumes("multipart/form-data"), EnableRateLimiting("guest-booking")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> Submit(
        string code, [FromHeader(Name = "X-Booking-Token")] string? token,
        [FromForm] SubmitPaymentProofRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try
        {
            var value = await service.SubmitGuestAsync(code, token, request, ct);
            return StatusCode(StatusCodes.Status201Created, value);
        }
        catch (BookingException e) { return ApiError(e); }
    }

    [HttpGet, EnableRateLimiting("guest-booking-read")]
    public async Task<IActionResult> List(
        string code, [FromHeader(Name = "X-Booking-Token")] string? token,
        CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await service.GuestSummaryAsync(code, token, ct)); }
        catch (BookingException e) { return ApiError(e); }
    }

    internal static IActionResult ApiError(BookingException e) =>
        Pickleball.Api.Controllers.Public.BookingsController.ApiError(e);
}
