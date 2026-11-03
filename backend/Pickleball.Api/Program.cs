using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;
using Pickleball.Api.Extensions;
using Pickleball.Api.Background;
using Pickleball.Api.Middleware;
using Pickleball.Api.Security;

var builder = WebApplication.CreateBuilder(args);
builder.AddDeploymentConfiguration();

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddApplicationServices();
builder.Services.AddPickleballDatabase(builder.Configuration);
builder.Services.AddStaffAuthentication(builder.Environment);
builder.Services.AddHostedService<PendingBookingExpiryWorker>();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("guest-booking", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 8,
            Window = TimeSpan.FromMinutes(5),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("guest-booking-read", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 30,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
    options.AddPolicy("staff-login", context => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        }));
});

const string frontendCorsPolicy = "VenueFrontend";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddPolicy(frontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()
            .AllowCredentials()));

var app = builder.Build();

if (args.Contains("--bootstrap-owner", StringComparer.Ordinal))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<OwnerBootstrapService>().RunAsync();
    Console.WriteLine("Initial owner account created. Remove the bootstrap password from user-secrets.");
    return;
}

app.UseForwardedHeaders();
if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers.CacheControl = "no-store";
    await next();
});
app.UseExceptionHandler();
app.UseRouting();
app.UseCors(frontendCorsPolicy);
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AdminCsrfMiddleware>();
app.MapControllers();
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });
app.MapDatabaseHealth();

app.Run();

public partial class Program { }
