using Pickleball.Api.DTOs.Auth;

namespace Pickleball.Api.Security;

public interface IStaffAuthService
{
    Task<StaffProfile?> ValidateAsync(LoginRequest request, CancellationToken ct);
    Task<bool> ChangePasswordAsync(long staffId, string currentPassword, string newPassword,
        CancellationToken ct);
    Task<IReadOnlyList<StaffProfile>> ListAsync(CancellationToken ct);
    Task<StaffProfile> CreateAsync(CreateStaffRequest request, CancellationToken ct);
    Task<bool> SetActiveAsync(long staffId, bool active, long actorId, CancellationToken ct);
    Task<bool> ResetPasswordAsync(long staffId, string password, CancellationToken ct);
}
