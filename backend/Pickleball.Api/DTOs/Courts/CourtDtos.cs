using System.ComponentModel.DataAnnotations;

namespace Pickleball.Api.DTOs.Courts;

public sealed record CourtResponse(
    long Id, string CourtName, string? Description,
    decimal BaseHourlyRate, int DisplayOrder, bool IsActive);

public sealed class SaveCourtRequest
{
    [Required, StringLength(100, MinimumLength = 1)]
    public string CourtName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal BaseHourlyRate { get; set; }

    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
