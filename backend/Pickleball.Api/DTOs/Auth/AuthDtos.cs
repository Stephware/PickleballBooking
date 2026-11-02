using System.ComponentModel.DataAnnotations;

namespace Pickleball.Api.DTOs.Auth;

public sealed class LoginRequest
{
    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public sealed record StaffProfile(long Id, string FullName, string Email, string Role, bool IsActive);

public sealed class CreateStaffRequest
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(12), MaxLength(128)]
    public string Password { get; set; } = string.Empty;

    [Required]
    public string Role { get; set; } = string.Empty;
}

public sealed class ChangePasswordRequest
{
    [Required] public string CurrentPassword { get; set; } = string.Empty;
    [Required, MinLength(12), MaxLength(128)]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class ResetStaffPasswordRequest
{
    [Required, MinLength(12), MaxLength(128)]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class SetStaffActiveRequest
{
    public bool IsActive { get; set; }
}
