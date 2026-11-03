using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Security;

public static class StaffAuthExtensions
{
    public static IServiceCollection AddStaffAuthentication(
        this IServiceCollection services, IWebHostEnvironment environment)
    {
        services.AddScoped<IPasswordHasher<StaffUser>, PasswordHasher<StaffUser>>();
        services.AddScoped<IStaffAuthService, StaffAuthService>();
        services.AddScoped<OwnerBootstrapService>();

        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "pickleball.staff";
                options.Cookie.HttpOnly = true;
                options.Cookie.Path = "/api/v1/admin";
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = environment.IsDevelopment()
                    ? CookieSecurePolicy.SameAsRequest
                    : CookieSecurePolicy.Always;
                options.Cookie.IsEssential = true;
                options.LoginPath = "/api/v1/admin/auth/login";
                options.AccessDeniedPath = "/api/v1/admin/auth/login";
                options.SlidingExpiration = false;
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.Events = new CookieAuthenticationEvents
                {
                    OnRedirectToLogin = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    },
                    OnRedirectToAccessDenied = context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        return Task.CompletedTask;
                    },
                    // Re-check DB on every request; disabled staff and changed
                    // roles are rejected without waiting for cookie expiry.
                    OnValidatePrincipal = async context =>
                    {
                        var rawId = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                        var role = context.Principal?.FindFirstValue(ClaimTypes.Role);
                        if (!long.TryParse(rawId, out var id))
                        {
                            context.RejectPrincipal();
                            await context.HttpContext.SignOutAsync();
                            return;
                        }
                        var db = context.HttpContext.RequestServices
                            .GetRequiredService<PickleballDbContext>();
                        var staff = await db.StaffUsers.AsNoTracking()
                            .SingleOrDefaultAsync(s => s.Id == id,
                                context.HttpContext.RequestAborted);
                        if (staff is null || !staff.IsActive || staff.Role != role ||
                            context.Principal?.FindFirst("staff.password.fingerprint")?.Value !=
                                StaffSecurityFingerprint.FromHash(staff.PasswordHash))
                        {
                            context.RejectPrincipal();
                            await context.HttpContext.SignOutAsync();
                        }
                    }
                };
            });

        services.AddAuthorization();
        services.AddAntiforgery(options =>
        {
            options.HeaderName = "X-CSRF-TOKEN";
            options.Cookie.Name = "pickleball.csrf";
            options.Cookie.HttpOnly = true;
            options.Cookie.SameSite = SameSiteMode.Lax;
            options.Cookie.SecurePolicy = environment.IsDevelopment()
                ? CookieSecurePolicy.SameAsRequest
                : CookieSecurePolicy.Always;
        });
        return services;
    }
}
