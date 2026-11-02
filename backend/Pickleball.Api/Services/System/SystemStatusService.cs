using Pickleball.Api.DTOs.System;

namespace Pickleball.Api.Services.System;

public sealed class SystemStatusService(TimeProvider clock) : ISystemStatusService
{
    public ApiStatusResponse GetStatus() =>
        new("Pickleball.Api", "healthy", clock.GetUtcNow());
}
