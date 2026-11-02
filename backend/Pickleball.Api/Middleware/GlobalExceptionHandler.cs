using Microsoft.AspNetCore.Diagnostics;

namespace Pickleball.Api.Middleware;

/// <summary>Returns safe Problem Details without exposing internal exceptions.</summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Unhandled API error at {Path}", httpContext.Request.Path);

        await Results.Problem(
            title: "Unexpected server error",
            detail: "The request could not be processed.",
            statusCode: StatusCodes.Status500InternalServerError)
            .ExecuteAsync(httpContext);

        return true;
    }
}
