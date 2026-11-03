using Microsoft.AspNetCore.Mvc;
using Pickleball.Api.Services.Courts;

namespace Pickleball.Api.Controllers.Public;

[ApiController]
[Route("api/v1/courts")]
public sealed class CourtsController(ICourtService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await service.ListAsync(true, ct));
}
