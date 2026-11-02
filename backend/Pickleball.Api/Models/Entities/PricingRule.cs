namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.pricing_rules.</summary>
public sealed class PricingRule
{
    public long Id { get; set; }
    public long? CourtId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public short? DayOfWeek { get; set; }
    public TimeOnly StartsAt { get; set; }
    public TimeOnly EndsAt { get; set; }
    public decimal HourlyRate { get; set; }
    public int Priority { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
