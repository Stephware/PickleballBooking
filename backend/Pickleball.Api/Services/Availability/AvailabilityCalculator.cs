using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;

namespace Pickleball.Api.Services.Availability;

/// <summary>Pure status resolver. Never consider an expired-at timestamp as free
/// while the database row still has an active status (GiST exclusion still blocks).</summary>
public static class AvailabilityCalculator
{
    public static string GetStatus(
        DateTime slotStartUtc, DateTime slotEndUtc,
        DateTime nowUtc, DateTime firstBookableUtc, bool insideBookingHorizon,
        IEnumerable<CourtScheduleEntry> overlappingEntries)
    {
        if (slotStartUtc >= slotEndUtc)
            throw new ArgumentException("Invalid slot range.");

        // Elapsed includes an already-started slot even if it has not ended.
        if (slotStartUtc <= nowUtc) return AvailabilityStatuses.Elapsed;

        var entries = overlappingEntries
            .Where(e => e.StartsAt < slotEndUtc && e.EndsAt > slotStartUtc)
            .ToArray();

        if (entries.Any(e => e.Status == BookingStatuses.Blocked))
            return AvailabilityStatuses.Blocked;
        if (entries.Any(e => e.Status is BookingStatuses.Confirmed or BookingStatuses.Completed))
            return AvailabilityStatuses.Occupied;
        if (entries.Any(e => e.Status is BookingStatuses.Held or BookingStatuses.AwaitingReview))
            return AvailabilityStatuses.Pending;

        if (!insideBookingHorizon || slotStartUtc < firstBookableUtc)
            return AvailabilityStatuses.Unavailable;

        return AvailabilityStatuses.Available;
    }
}
