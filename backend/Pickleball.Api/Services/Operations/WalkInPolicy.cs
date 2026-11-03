using Pickleball.Api.DTOs.Availability;
using Pickleball.Api.Models.Enums;

namespace Pickleball.Api.Services.Operations;

/// <summary>
/// Only the current venue slot is eligible, and only for WALK_IN bookings.
/// A live schedule lookup is additionally required before permitting it.
/// </summary>
public static class WalkInPolicy
{
    public static bool IsWithinGrace(
        AvailabilitySlotResponse slot, DateTime nowUtc, int slotMinutes)
    {
        if (slot.Status != AvailabilityStatuses.Elapsed || slotMinutes <= 0)
            return false;
        var start = slot.StartsAtUtc.UtcDateTime;
        var end = slot.EndsAtUtc.UtcDateTime;
        var grace = TimeSpan.FromMinutes(Math.Min(30, slotMinutes / 2.0));
        return start <= nowUtc && nowUtc < end && nowUtc - start <= grace;
    }
}
