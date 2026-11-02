namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.staff_users.</summary>
public sealed class StaffUser
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "STAFF";
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
