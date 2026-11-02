using Microsoft.EntityFrameworkCore;
using Pickleball.Api.Data;
using Pickleball.Api.DTOs.Venue;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories;
using Pickleball.Api.Repositories.Settings;

namespace Pickleball.Api.Services.Venue;

public sealed class VenueService(
    IVenueRepository repository, PickleballDbContext db, IUnitOfWork unit)
    : IVenueService
{
    public async Task<PublicVenueResponse?> GetPublicAsync(CancellationToken ct)
    {
        var venue = await repository.GetAsync(ct);
        return venue is null ? null : new(
            venue.VenueName, venue.VenueSlug, venue.Timezone, venue.Currency.Trim(),
            venue.LogoUrl, venue.PrimaryColor.Trim(), venue.SecondaryColor.Trim());
    }

    public async Task<VenueSettingsResponse?> GetSettingsAsync(CancellationToken ct)
    {
        var venue = await repository.GetAsync(ct);
        return venue is null ? null : Map(venue);
    }

    public async Task<VenueSettingsResponse?> UpdateAsync(SaveVenueRequest input, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(input.VenueName) ||
            input.SlotMinutes is not (30 or 60 or 90 or 120))
            throw new ArgumentException("Provide a venue name and supported slot duration (30, 60, 90, 120).");

        if (input.LogoUrl is not null &&
            (!Uri.TryCreate(input.LogoUrl, UriKind.Absolute, out var logo) ||
             logo.Scheme != Uri.UriSchemeHttps))
            throw new ArgumentException("Logo URL must be an absolute HTTPS URL.");

        try { _ = TimeZoneInfo.FindSystemTimeZoneById(input.Timezone); }
        catch (TimeZoneNotFoundException) { throw new ArgumentException("Unknown IANA timezone."); }
        catch (InvalidTimeZoneException) { throw new ArgumentException("Invalid timezone."); }

        var venue = await repository.GetAsync(ct);
        if (venue is null) return null;
        venue.VenueName = input.VenueName.Trim();
        venue.VenueSlug = input.VenueSlug;
        venue.Timezone = input.Timezone;
        venue.Currency = input.Currency;
        venue.LogoUrl = input.LogoUrl;
        venue.PrimaryColor = input.PrimaryColor;
        venue.SecondaryColor = input.SecondaryColor;
        venue.SlotMinutes = input.SlotMinutes;
        venue.HoldMinutes = input.HoldMinutes;
        venue.ReviewTimeoutHours = input.ReviewTimeoutHours;
        venue.BookingAdvanceDays = input.BookingAdvanceDays;
        venue.MinimumNoticeMinutes = input.MinimumNoticeMinutes;
        await unit.SaveChangesAsync(ct);
        return Map(venue);
    }

    public async Task<IReadOnlyList<OperatingHourResponse>> GetHoursAsync(CancellationToken ct) =>
        (await repository.GetHoursAsync(ct))
            .Select(h => new OperatingHourResponse(h.DayOfWeek, h.IsClosed, h.OpensAt, h.ClosesAt))
            .ToArray();

    public async Task<IReadOnlyList<OperatingHourResponse>> SaveHoursAsync(
        SaveOperatingHoursRequest request, CancellationToken ct)
    {
        var days = request.Days;
        if (days is null || days.Count != 7 ||
            days.Select(d => d.DayOfWeek).Distinct().Count() != 7 ||
            days.Any(d => d.DayOfWeek is < 0 or > 6))
            throw new ArgumentException("Provide one entry for every weekday (0=Sunday ... 6=Saturday).");

        foreach (var day in days)
        {
            if (day.IsClosed && (day.OpensAt is not null || day.ClosesAt is not null))
                throw new ArgumentException("Closed days must not specify opening or closing time.");
            if (!day.IsClosed && (day.OpensAt is null || day.ClosesAt is null ||
                                  day.OpensAt >= day.ClosesAt))
                throw new ArgumentException("Open days need same-day opening and closing times.");
        }

        var existing = await db.OperatingHours.ToDictionaryAsync(d => d.DayOfWeek, ct);
        foreach (var day in days)
        {
            if (!existing.TryGetValue(day.DayOfWeek, out var entity))
            {
                entity = new OperatingHour { DayOfWeek = day.DayOfWeek };
                db.OperatingHours.Add(entity);
            }
            entity.IsClosed = day.IsClosed;
            entity.OpensAt = day.OpensAt;
            entity.ClosesAt = day.ClosesAt;
        }
        await unit.SaveChangesAsync(ct);
        return await GetHoursAsync(ct);
    }

    private static VenueSettingsResponse Map(VenueSettings v) =>
        new(v.VenueName, v.VenueSlug, v.Timezone, v.Currency.Trim(),
            v.LogoUrl, v.PrimaryColor.Trim(), v.SecondaryColor.Trim(),
            v.SlotMinutes, v.HoldMinutes, v.ReviewTimeoutHours,
            v.BookingAdvanceDays, v.MinimumNoticeMinutes);
}
