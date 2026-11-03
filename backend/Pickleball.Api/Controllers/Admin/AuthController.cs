using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Microsoft.AspNetCore.RateLimiting;
using Pickleball.Api.DTOs.Auth;
using Pickleball.Api.Security;

namespace Pickleball.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/auth")]
public sealed class AuthController(IStaffAuthService auth, IAntiforgery antiforgery,
    PickleballDbContext db)
    : ControllerBase
{
    [HttpGet("csrf"), AllowAnonymous]
    public IActionResult Csrf()
    {
        Response.Headers.CacheControl = "no-store";
        return Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });
    }

    [HttpPost("login"), AllowAnonymous, EnableRateLimiting("staff-login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var staff = await auth.ValidateAsync(request, ct);
        if (staff is null)
            return Unauthorized(new { error = "Invalid email or password." });

        var row = await db.StaffUsers.AsNoTracking().SingleAsync(s => s.Id == staff.Id, ct);
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, staff.Id.ToString()),
                new Claim(ClaimTypes.Name, staff.FullName),
                new Claim(ClaimTypes.Email, staff.Email),
                new Claim(ClaimTypes.Role, staff.Role),
                new Claim("staff.password.fingerprint", StaffSecurityFingerprint.FromHash(row.PasswordHash))
            ], CookieAuthenticationDefaults.AuthenticationScheme));
        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
            principal, new AuthenticationProperties { IsPersistent = false });
        return Ok(staff);
    }

    [HttpPost("logout"), Authorize(Roles = StaffRoles.AnyStaff)]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [HttpPost("change-password"), Authorize(Roles = StaffRoles.AnyStaff)]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken ct)
    {
        if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
            return Unauthorized();
        try
        {
            if (!await auth.ChangePasswordAsync(id, request.CurrentPassword, request.NewPassword, ct))
                return Unauthorized(new { error = "Current password is incorrect." });
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return NoContent();
        }
        catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    }

    [HttpGet("me"), Authorize(Roles = StaffRoles.AnyStaff)]
    public IActionResult Me()
    {
        if (!long.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
            return Unauthorized();
        return Ok(new StaffProfile(id, User.Identity?.Name ?? "",
            User.FindFirstValue(ClaimTypes.Email) ?? "",
            User.FindFirstValue(ClaimTypes.Role) ?? "", true));
    }
}
