namespace Pickleball.Api.Models.Enums;

/// <summary>Derived UI statuses; never persisted as schedule entry statuses.</summary>
public static class AvailabilityStatuses
{
    public const string Available = "AVAILABLE";
    // Staff-only display state, not persisted and never exposed by public availability.
    public const string WalkInNow = "WALK_IN_NOW";
    public const string Occupied = "OCCUPIED";
    public const string Pending = "PENDING";
    public const string Elapsed = "ELAPSED";
    public const string Blocked = "BLOCKED";
    public const string Unavailable = "UNAVAILABLE"; // notice / booking horizon
}
