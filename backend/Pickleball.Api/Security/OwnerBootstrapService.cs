using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Security;

/// <summary>One-time CLI bootstrap, NOT an exposed HTTP endpoint.</summary>
public sealed class OwnerBootstrapService(
    PickleballDbContext db, IPasswordHasher<StaffUser> hasher,
    IConfiguration config)
{
    public async Task RunAsync(CancellationToken ct = default)
    {
        var email = config["Bootstrap:OwnerEmail"]?.Trim().ToLowerInvariant();
        var name = config["Bootstrap:OwnerName"]?.Trim();
        var password = config["Bootstrap:OwnerPassword"];

        if (string.IsNullOrWhiteSpace(name) || name.Length > 150 ||
            string.IsNullOrWhiteSpace(email) || email.Length > 254 ||
            !new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email) ||
            string.IsNullOrWhiteSpace(password) || password.Length is < 12 or > 128)
            throw new InvalidOperationException(
                "Set valid Bootstrap:OwnerName, Bootstrap:OwnerEmail and a password (12+ characters) in user-secrets.");

        // Prevent two parallel bootstrap processes both granting first-owner access.
        await using var tx = await db.Database.BeginTransactionAsync(
            System.Data.IsolationLevel.Serializable, ct);
        if (await db.StaffUsers.AnyAsync(ct))
            throw new InvalidOperationException("Bootstrap refused: staff accounts already exist.");

        var owner = new StaffUser
        {
            FullName = name, Email = email, IsActive = true, Role = StaffRoles.Owner
        };
        owner.PasswordHash = hasher.HashPassword(owner, password);
        db.StaffUsers.Add(owner);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
    }
}
