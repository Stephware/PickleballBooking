using System.ComponentModel.DataAnnotations;

namespace Pickleball.Api.DTOs.Venue;

public sealed record PublicVenueResponse(
    string VenueName, string VenueSlug, string Timezone, string Currency,
    string? LogoUrl, string PrimaryColor, string SecondaryColor);

public sealed record VenueSettingsResponse(
    string VenueName, string VenueSlug, string Timezone, string Currency,
    string? LogoUrl, string PrimaryColor, string SecondaryColor,
    int SlotMinutes, int HoldMinutes,
    int BookingAdvanceDays, int MinimumNoticeMinutes);

public sealed class SaveVenueRequest
{
    [Required, StringLength(150, MinimumLength = 1)]
    public string VenueName { get; set; } = string.Empty;

    [Required, RegularExpression(@"^[a-z0-9]+(-[a-z0-9]+)*$"), MaxLength(100)]
    public string VenueSlug { get; set; } = string.Empty;

    [Required, MaxLength(64)]
    public string Timezone { get; set; } = "Asia/Manila";

    [Required, RegularExpression("^[A-Z]{3}$")]
    public string Currency { get; set; } = "PHP";

    [MaxLength(2048)]
    public string? LogoUrl { get; set; }

    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")]
    public string PrimaryColor { get; set; } = "#16805D";

    [Required, RegularExpression("^#[0-9a-fA-F]{6}$")]
    public string SecondaryColor { get; set; } = "#F2F7F4";

    public int SlotMinutes { get; set; } = 60;
    [Range(1, 120)] public int HoldMinutes { get; set; } = 10;
    [Range(1, 365)] public int BookingAdvanceDays { get; set; } = 30;
    [Range(0, int.MaxValue)] public int MinimumNoticeMinutes { get; set; } = 30;
}

public sealed record OperatingHourResponse(short DayOfWeek, bool IsClosed,
    TimeOnly? OpensAt, TimeOnly? ClosesAt);

public sealed class SaveOperatingHoursRequest
{
    [Required, MinLength(7), MaxLength(7)]
    public List<SaveOperatingHour> Days { get; set; } = [];
}

public sealed class SaveOperatingHour
{
    [Range(0, 6)]
    public short DayOfWeek { get; set; }
    public bool IsClosed { get; set; }
    public TimeOnly? OpensAt { get; set; }
    public TimeOnly? ClosesAt { get; set; }
}
