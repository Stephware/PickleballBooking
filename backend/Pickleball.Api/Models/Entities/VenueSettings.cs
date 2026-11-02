namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.venue_settings.</summary>
public sealed class VenueSettings
{
    public short Id { get; set; }
    public string VenueName { get; set; } = string.Empty;
    public string VenueSlug { get; set; } = string.Empty;
    public string Timezone { get; set; } = "Asia/Manila";
    public string Currency { get; set; } = "PHP";
    public string? LogoUrl { get; set; }
    public string PrimaryColor { get; set; } = "#16805D";
    public string SecondaryColor { get; set; } = "#F2F7F4";
    public int SlotMinutes { get; set; }
    public int HoldMinutes { get; set; }
    public int ReviewTimeoutHours { get; set; }
    public int BookingAdvanceDays { get; set; }
    public int MinimumNoticeMinutes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
