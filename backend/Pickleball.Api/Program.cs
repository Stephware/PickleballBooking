var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Initial scaffold only: database models, authentication, and booking endpoints
// are NOT implemented yet. See docs/context/progress.md.
app.MapGet("/health", () => Results.Ok(new { status = "healthy", service = "Pickleball.Api" }));

app.Run();
