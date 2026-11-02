namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.court_schedule_entries.</summary>
public sealed class CourtScheduleEntry
{
    public long Id { get; set; }
    public long CourtId { get; set; }
    public string EntryType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? BlockReason { get; set; }
    public long? CreatedByStaffId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
