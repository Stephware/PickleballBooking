using Microsoft.AspNetCore.Antiforgery;

namespace Pickleball.Api.Security;

/// <summary>
/// All state-changing /api/v1/admin requests require an antiforgery header.
/// A public GET csrf endpoint issues the cookie/token pair.
/// </summary>
public sealed class AdminCsrfMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, IAntiforgery antiforgery)
    {
        var method = context.Request.Method;
        var unsafeMethod = method is not ("GET" or "HEAD" or "OPTIONS" or "TRACE");
        if (unsafeMethod && context.Request.Path.StartsWithSegments("/api/v1/admin"))
        {
            try
            {
                await antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new
                {
                    error = "Invalid or missing CSRF token. Refresh the form and try again."
                });
                return;
            }
        }

        await next(context);
    }
}
