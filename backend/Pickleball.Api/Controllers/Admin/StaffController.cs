using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Auth;
using Pickleball.Api.Security;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/staff")]
[Authorize(Roles = StaffRoles.Owner)]
public sealed class StaffController(IStaffAuthService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await service.ListAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateStaffRequest request, CancellationToken ct)
    {
        try
        {
            var user = await service.CreateAsync(request, ct);
            return Created($"/api/v1/admin/staff/{user.Id}", user);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPatch("{id:long}/active")]
    public async Task<IActionResult> SetActive(
        long id, SetStaffActiveRequest request, CancellationToken ct)
    {
        long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var actorId);
        try
        {
            return await service.SetActiveAsync(id, request.IsActive, actorId, ct)
                ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpPost("{id:long}/reset-password")]
    public async Task<IActionResult> ResetPassword(
        long id, ResetStaffPasswordRequest request, CancellationToken ct)
    {
        try
        {
            return await service.ResetPasswordAsync(id, request.NewPassword, ct)
                ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }
}
