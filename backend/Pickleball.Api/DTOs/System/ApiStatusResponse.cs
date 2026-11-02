namespace Pickleball.Api.DTOs.System;

/// <summary>Non-sensitive process status; does not imply database connectivity.</summary>
public sealed record ApiStatusResponse(
    string Service,
    string Status,
    DateTimeOffset UtcNow);
