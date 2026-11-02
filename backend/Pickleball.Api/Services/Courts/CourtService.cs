using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pickleball.Api.DTOs.Courts;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Models.Enums;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Courts;

namespace Pickleball.Api.Services.Courts;

public sealed class CourtService(ICourtRepository courts, IUnitOfWork unit, TimeProvider clock) : ICourtService
{
    public async Task<IReadOnlyList<CourtResponse>> ListAsync(bool activeOnly, CancellationToken ct)
    {
        var all = await courts.ListAsync(ct);
        return all.Where(c => !activeOnly || c.IsActive).Select(Map).ToArray();
    }

    public async Task<CourtResponse?> GetAsync(long id, CancellationToken ct)
    {
        var court = await courts.FindAsync(id, ct);
        return court is null ? null : Map(court);
    }

    public async Task<CourtResponse> CreateAsync(SaveCourtRequest request, CancellationToken ct)
    {
        Validate(request);
        var court = new Court
        {
            CourtName = request.CourtName.Trim(),
            Description = request.Description?.Trim(),
            BaseHourlyRate = request.BaseHourlyRate,
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive
        };
        courts.Add(court);
        await SaveAsync(ct);
        return Map(court);
    }

    public async Task<CourtResponse?> UpdateAsync(long id, SaveCourtRequest request, CancellationToken ct)
    {
        Validate(request);
        var court = await courts.FindAsync(id, ct);
        if (court is null) return null;

        // Preserve existing reservations: staff must resolve future bookings first.
        if (court.IsActive && !request.IsActive &&
            await courts.HasFutureBookingsAsync(id, clock.GetUtcNow().UtcDateTime, ct))
            throw new InvalidOperationException(
                "Cannot deactivate a court with future reservations. Resolve them first.");
        court.CourtName = request.CourtName.Trim();
        court.Description = request.Description?.Trim();
        court.BaseHourlyRate = request.BaseHourlyRate;
        court.DisplayOrder = request.DisplayOrder;
        court.IsActive = request.IsActive;
        await SaveAsync(ct);
        return Map(court);
    }

    private async Task SaveAsync(CancellationToken ct)
    {
        try { await unit.SaveChangesAsync(ct); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            throw new InvalidOperationException("A court with this name already exists.");
        }
    }

    private static void Validate(SaveCourtRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CourtName))
            throw new ArgumentException("Court name is required.");
        if (request.BaseHourlyRate < 0 || request.BaseHourlyRate > 99999999.99m)
            throw new ArgumentException("Court rate is outside the supported range.");
    }

    private static CourtResponse Map(Court c) =>
        new(c.Id, c.CourtName, c.Description, c.BaseHourlyRate, c.DisplayOrder, c.IsActive);
}
