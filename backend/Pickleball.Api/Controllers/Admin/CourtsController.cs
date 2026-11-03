using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Courts;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Courts;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/courts")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class CourtsController(ICourtService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await service.ListAsync(false, ct));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken ct)
    {
        var court = await service.GetAsync(id, ct);
        return court is null ? NotFound() : Ok(court);
    }

    [HttpPost]
    [Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Create(SaveCourtRequest request, CancellationToken ct)
    {
        try
        {
            var result = await service.CreateAsync(request, ct);
            return Created($"/api/v1/admin/courts/{result.Id}", result);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Update(long id, SaveCourtRequest request, CancellationToken ct)
    {
        try
        {
            var result = await service.UpdateAsync(id, request, ct);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }
}
