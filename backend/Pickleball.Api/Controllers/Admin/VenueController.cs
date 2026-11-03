using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Venue;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Venue;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/venue")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class VenueController(IVenueService service, IConfiguration configuration) : ControllerBase
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
        // Venue branding and global booking policy are developer-managed by default.
        // A trusted deployer can temporarily opt in to this existing OWNER API
        // via environment configuration; court/hours/pricing APIs are unchanged.
        if (!configuration.GetValue<bool>("Developer:AllowVenueEdits"))
            return StatusCode(StatusCodes.Status403Forbidden,
                new { error = "Venue customization is managed by the system developer." });
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
