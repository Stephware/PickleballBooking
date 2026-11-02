using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.Services.Availability;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/availability")]
public sealed class AvailabilityController(IAvailabilityService service) : ControllerBase
{
    // Example: GET /api/v1/availability?date=2026-11-03
    // Optional courtId narrows the response but all counts remain dynamic.
    [HttpGet]
    public async Task<IActionResult> Day(
        [FromQuery] DateOnly date, [FromQuery] long? courtId, CancellationToken ct)
    {
        if (date == default || courtId is <= 0)
            return BadRequest(new { error = "Provide a valid date and optional positive courtId." });
        Response.Headers.CacheControl = "no-store";
        try { return Ok(await service.GetDayAsync(date, courtId, ct)); }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Court not found or inactive." });
        }
        catch (InvalidTimeZoneException)
        {
            return StatusCode(503, new { error = "Venue timezone is invalid." });
        }
        catch (TimeZoneNotFoundException)
        {
            return StatusCode(503, new { error = "Venue timezone is not configured correctly." });
        }
        catch (ArgumentException)
        {
            return UnprocessableEntity(new { error = "Venue-local time conversion is unavailable for this date." });
        }
    }
}
