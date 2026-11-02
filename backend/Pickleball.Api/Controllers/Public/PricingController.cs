using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.Services.Availability;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/pricing")]
public sealed class PricingController(IAvailabilityService availability) : ControllerBase
{
    // Uses exactly the same server-side calculation and live status as
    // the availability grid; never accepts a frontend-supplied total.
    [HttpGet("quote")]
    public async Task<IActionResult> Quote(
        [FromQuery] DateOnly date, [FromQuery] long courtId,
        [FromQuery] TimeOnly startsAt, CancellationToken ct)
    {
        if (date == default || courtId <= 0)
            return BadRequest(new { error = "Provide a valid date and courtId." });
        Response.Headers.CacheControl = "no-store";
        try
        {
            var quote = await availability.GetQuoteAsync(date, courtId, startsAt, ct);
            return quote is null ? NotFound(new { error = "Slot not found." }) : Ok(quote);
        }
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
