using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Venue;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Venue;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/venue")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class VenueController(IVenueService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var value = await service.GetSettingsAsync(ct);
        return value is null ? NotFound() : Ok(value);
    }

    [HttpPut]
    [Authorize(Roles = StaffRoles.Owner)]
    public async Task<IActionResult> Update(SaveVenueRequest request, CancellationToken ct)
    {
        try
        {
            var saved = await service.UpdateAsync(request, ct);
            return saved is null ? NotFound() : Ok(saved);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("hours")]
    public async Task<IActionResult> GetHours(CancellationToken ct) =>
        Ok(await service.GetHoursAsync(ct));

    [HttpPut("hours")]
    [Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> SaveHours(SaveOperatingHoursRequest request, CancellationToken ct)
    {
        try { return Ok(await service.SaveHoursAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
