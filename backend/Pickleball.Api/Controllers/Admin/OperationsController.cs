using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Operations;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Bookings;
using Pickleball.Api.Services.Operations;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/operations")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class OperationsController(IOperationsService service) : ControllerBase
{
    [HttpGet("availability")]
    public async Task<IActionResult> Availability([FromQuery] DateOnly date, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        if (date == default) return BadRequest(new { error = "Choose a valid date." });
        try { return Ok(await service.GetStaffAvailabilityAsync(date, ct)); }
        catch (ArgumentOutOfRangeException) { return BadRequest(new { error = "Date is outside the booking window." }); }
    }

    [HttpPost("manual-bookings")]
    public async Task<IActionResult> CreateManual(
        CreateManualBookingRequest request, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try
        {
            var result = await service.CreateManualAsync(request, Actor(), ct);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (BookingException e) { return Error(e); }
    }

    [HttpGet("blocks")]
    public async Task<IActionResult> Blocks([FromQuery] DateOnly date, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await service.BlocksAsync(date, ct)); }
        catch (BookingException e) { return Error(e); }
    }

    [HttpPost("blocks"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Block(CreateCourtBlockRequest request, CancellationToken ct)
    {
        try
        {
            var result = await service.BlockAsync(request, Actor(), ct);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (BookingException e) { return Error(e); }
    }

    [HttpPost("blocks/{id:long}/remove"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> RemoveBlock(long id, CancellationToken ct)
    {
        try { return Ok(await service.UnblockAsync(id, ct)); }
        catch (BookingException e) { return Error(e); }
    }

    private long Actor() => long.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static IActionResult Error(BookingException e) =>
        Pickleball.Api.Controllers.Public.BookingsController.ApiError(e);
}
