using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.Services.Venue;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/venue")]
public sealed class VenueController(IVenueService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var venue = await service.GetPublicAsync(ct);
        return venue is null ? NotFound() : Ok(venue);
    }

    [HttpGet("hours")]
    public async Task<IActionResult> GetHours(CancellationToken ct) =>
        Ok(await service.GetHoursAsync(ct));
}
