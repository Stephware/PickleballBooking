using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;

namespace Pickleball.Api.Background;

/// <summary>
/// Periodic SQL status transition; a past expires_at alone never frees a court.
/// This worker is only one layer: booking transactions also expire stale holds.
/// </summary>
public sealed class PendingBookingExpiryWorker(
    IServiceScopeFactory scopes, ILogger<PendingBookingExpiryWorker> logger,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Pickleball")))
        {
            logger.LogInformation("Booking expiry worker inactive: no database connection configured.");
            return;
        }

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(30));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopes.CreateAsyncScope();
                var db = scope.ServiceProvider.GetRequiredService<PickleballDbContext>();
                var count = await db.Database.SqlQueryRaw<int>(
                    "SELECT expire_pending_schedule_entries() AS \"Value\"")
                    .SingleAsync(stoppingToken);
                if (count > 0)
                    logger.LogInformation("Expired {Count} pending booking entries.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error)
            {
                logger.LogError(error, "Pending booking expiry pass failed.");
            }

            if (!await timer.WaitForNextTickAsync(stoppingToken))
                break;
        }
    }
}
