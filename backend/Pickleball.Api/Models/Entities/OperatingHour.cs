namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.operating_hours.</summary>
public sealed class OperatingHour
{
    public short DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public TimeOnly? OpensAt { get; set; }
    public TimeOnly? ClosesAt { get; set; }
}
