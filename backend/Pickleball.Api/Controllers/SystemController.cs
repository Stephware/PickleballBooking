using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.DTOs.System;
using Pickleball.Api.Services.System;

namespace Pickleball.Api.Controllers;

[ApiController]
[Route("api/v1/system")]
public sealed class SystemController(ISystemStatusService statusService) : ControllerBase
{
    [HttpGet("status")]
    [ProducesResponseType<ApiStatusResponse>(StatusCodes.Status200OK)]
    public ActionResult<ApiStatusResponse> GetStatus() =>
        Ok(statusService.GetStatus());
}
