using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.Pricing;
using Pickleball.Api.Security;
using Pickleball.Api.Services.Pricing;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/pricing/rules")]
[Authorize(Roles = StaffRoles.AnyStaff)]
public sealed class PricingRulesController(IPricingService pricing) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await pricing.ListAsync(ct));

    [HttpPost, Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Create(SavePricingRuleRequest request, CancellationToken ct)
    {
        try
        {
            var saved = await pricing.CreateAsync(request, ct);
            return Created($"/api/v1/admin/pricing/rules/{saved.Id}", saved);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPut("{id:long}"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Update(
        long id, SavePricingRuleRequest request, CancellationToken ct)
    {
        if (id <= 0) return BadRequest();
        try
        {
            var saved = await pricing.UpdateAsync(id, request, ct);
            return saved is null ? NotFound() : Ok(saved);
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { error = ex.Message }); }
    }

    [HttpPatch("{id:long}/deactivate"), Authorize(Roles = StaffRoles.Management)]
    public async Task<IActionResult> Deactivate(long id, CancellationToken ct)
    {
        if (id <= 0) return BadRequest();
        return await pricing.SetActiveAsync(id, false, ct) ? NoContent() : NotFound();
    }
}
