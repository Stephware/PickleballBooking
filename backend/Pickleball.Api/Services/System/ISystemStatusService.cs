using Pickleball.Api.DTOs.System;

namespace Pickleball.Api.Services.System;

public interface ISystemStatusService
{
    ApiStatusResponse GetStatus();
}
