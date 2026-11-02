using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Pickleball.Api.Extensions;
using Pickleball.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddApplicationServices();
builder.Services.AddPickleballDatabase(builder.Configuration);

const string frontendCorsPolicy = "VenueFrontend";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
    options.AddPolicy(frontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()));

var app = builder.Build();

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseExceptionHandler();
app.UseCors(frontendCorsPolicy);

app.MapControllers();
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = _ => false // Process-only check; keep Phase 1 contract.
});
app.MapDatabaseHealth(); // DB + all required tables + configured venue row.

app.Run();

public partial class Program { }
