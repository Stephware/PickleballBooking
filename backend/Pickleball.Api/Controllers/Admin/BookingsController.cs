using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Bookings;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Bookings;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/bookings")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class BookingsController(IBookingService bookings) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] DateOnly date, CancellationToken ct)
    {
        Response.Headers.CacheControl = "no-store"; // Admin bookings contain guest contact data.
        if (date == default) return BadRequest(new { error = "Valid date is required." });
        try { return Ok(await bookings.ListStaffAsync(date, ct)); }
        catch (ArgumentOutOfRangeException)
        {
            return BadRequest(new { error = "Date is out of range." });
        }
    }

    [HttpPost("{code}/confirm"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Confirm(string code, CancellationToken ct)
    {
        try { return Ok(await bookings.ConfirmStaffAsync(code, ct)); }
        catch (BookingException error)
        {
            return Pickleball.Api.Controllers.Public.BookingsController.ApiError(error);
        }
    }

    [HttpPost("{code}/cancel"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Cancel(
        string code, CancelBookingRequest request, CancellationToken ct)
    {
        try { return Ok(await bookings.CancelStaffAsync(code, request, ct)); }
        catch (BookingException error)
        {
            return Pickleball.Api.Controllers.Public.BookingsController.ApiError(error);
        }
    }
}
