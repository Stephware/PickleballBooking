using System.ComponentModel.DataAnnotations;

namespace Pickleball.Api.DTOs.Pricing;

public sealed record PricingRuleResponse(
    long Id, long? CourtId, string RuleName, short? DayOfWeek,
    TimeOnly StartsAt, TimeOnly EndsAt, decimal HourlyRate,
    int Priority, bool IsActive);

public sealed class SavePricingRuleRequest
{
    public long? CourtId { get; set; }

    [Required, StringLength(120, MinimumLength = 1)]
    public string RuleName { get; set; } = string.Empty;

    [Range(0, 6)]
    public short? DayOfWeek { get; set; }

    public TimeOnly StartsAt { get; set; }
    public TimeOnly EndsAt { get; set; }

    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal HourlyRate { get; set; }

    public int Priority { get; set; }
    public bool IsActive { get; set; } = true;
}
