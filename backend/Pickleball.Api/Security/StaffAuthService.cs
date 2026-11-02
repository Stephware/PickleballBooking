using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Auth;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories;

namespace Pickleball.Api.Security;

public sealed class StaffAuthService(
    PickleballDbContext db, IUnitOfWork unit,
    IPasswordHasher<StaffUser> hasher) : IStaffAuthService
{
    public async Task<StaffProfile?> ValidateAsync(LoginRequest request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var staff = await db.StaffUsers.SingleOrDefaultAsync(
            s => s.Email.ToLower() == email && s.IsActive, ct);
        if (staff is null) return null;
        var check = hasher.VerifyHashedPassword(staff, staff.PasswordHash, request.Password);
        if (check == PasswordVerificationResult.Failed) return null;
        if (check == PasswordVerificationResult.SuccessRehashNeeded)
        {
            staff.PasswordHash = hasher.HashPassword(staff, request.Password);
            await unit.SaveChangesAsync(ct);
        }
        return Profile(staff);
    }

    public async Task<bool> ChangePasswordAsync(
        long staffId, string currentPassword, string newPassword, CancellationToken ct)
    {
        if (newPassword.Length < 12 || newPassword.Length > 128)
            throw new ArgumentException("Password must be between 12 and 128 characters.");
        var user = await db.StaffUsers.SingleOrDefaultAsync(s => s.Id == staffId && s.IsActive, ct);
        if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, currentPassword)
            == PasswordVerificationResult.Failed)
            return false;
        user.PasswordHash = hasher.HashPassword(user, newPassword);
        await unit.SaveChangesAsync(ct);
        return true;
    }

    public async Task<IReadOnlyList<StaffProfile>> ListAsync(CancellationToken ct) =>
        await db.StaffUsers.AsNoTracking().OrderBy(s => s.FullName)
            .Select(s => new StaffProfile(s.Id, s.FullName, s.Email, s.Role, s.IsActive))
            .ToListAsync(ct);

    public async Task<StaffProfile> CreateAsync(CreateStaffRequest request, CancellationToken ct)
    {
        if (request.Role is not (StaffRoles.Manager or StaffRoles.Staff))
            throw new ArgumentException("New accounts must have MANAGER or STAFF role.");
        if (string.IsNullOrWhiteSpace(request.FullName) || request.Password.Length < 12)
            throw new ArgumentException("Name and strong password are required.");

        var user = new StaffUser
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Role = request.Role,
            IsActive = true
        };
        user.PasswordHash = hasher.HashPassword(user, request.Password);
        db.StaffUsers.Add(user);
        try { await unit.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new InvalidOperationException("Staff email already exists.");
        }
        return Profile(user);
    }

    public async Task<bool> SetActiveAsync(long staffId, bool active, long actorId, CancellationToken ct)
    {
        var user = await db.StaffUsers.SingleOrDefaultAsync(s => s.Id == staffId, ct);
        if (user is null) return false;
        if (user.Role == StaffRoles.Owner || user.Id == actorId)
            throw new ArgumentException("Owner and current session cannot be deactivated.");
        user.IsActive = active;
        await unit.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> ResetPasswordAsync(long staffId, string password, CancellationToken ct)
    {
        var user = await db.StaffUsers.SingleOrDefaultAsync(s => s.Id == staffId, ct);
        if (user is null) return false;
        if (user.Role == StaffRoles.Owner)
            throw new ArgumentException("Owner password changes require a dedicated recovery process.");
        if (password.Length < 12)
            throw new ArgumentException("A password of at least 12 characters is required.");
        user.PasswordHash = hasher.HashPassword(user, password);
        await unit.SaveChangesAsync(ct);
        return true;
    }

    private static StaffProfile Profile(StaffUser user) =>
        new(user.Id, user.FullName, user.Email, user.Role, user.IsActive);
}
