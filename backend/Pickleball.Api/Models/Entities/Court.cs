namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.courts.</summary>
public sealed class Court
{
    public long Id { get; set; }
    public string CourtName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal BaseHourlyRate { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
