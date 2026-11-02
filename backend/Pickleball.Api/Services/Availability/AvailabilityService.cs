using Pickleball.Api.DTOs.Availability;
using Pickleball.Api.Models.Entities;
using Pickleball.Api.Repositories.Courts;
using Pickleball.Api.Repositories.Scheduling;
using Pickleball.Api.Repositories.Settings;
using Pickleball.Api.Services.Pricing;

namespace Pickleball.Api.Services.Availability;

public sealed class AvailabilityService(
    IVenueRepository venues, ICourtRepository courts, IScheduleRepository schedules,
    TimeProvider clock) : IAvailabilityService
{
    public async Task<AvailabilityDayResponse> GetDayAsync(
        DateOnly date, long? courtId, CancellationToken ct)
    {
        var venue = await venues.GetAsync(ct)
            ?? throw new InvalidOperationException("Venue settings are not configured.");
        var zone = TimeZoneInfo.FindSystemTimeZoneById(venue.Timezone);
        var now = clock.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).Date);
        // Guard excessive queries and unsupported input years; historic slots are
        // informational, never eligible for a new reservation.
        if (date < today.AddDays(-365) || date > today.AddDays(venue.BookingAdvanceDays))
            throw new ArgumentOutOfRangeException(nameof(date),
                "Choose a date within the booking window.");

        var all = await courts.ListAsync(ct);
        var selected = all.Where(c => c.IsActive && (courtId is null || c.Id == courtId))
            .ToArray();
        if (courtId.HasValue && selected.Length == 0)
            throw new KeyNotFoundException("The selected court does not exist or is inactive.");

        var hours = await venues.GetHoursAsync(ct);
        var dailyHours = hours.SingleOrDefault(h => h.DayOfWeek == (short)date.DayOfWeek);
        var closed = dailyHours is null || dailyHours.IsClosed ||
            dailyHours.OpensAt is null || dailyHours.ClosesAt is null;
        if (closed)
            return new(date, venue.Timezone, venue.Currency.Trim(), true,
                venue.SlotMinutes,
                selected.Select(c => new AvailabilityCourtResponse(
                    c.Id, c.CourtName, [])).ToArray());

        var generated = LocalTimeSlots.Generate(date,
            dailyHours!.OpensAt!.Value, dailyHours.ClosesAt!.Value,
            venue.SlotMinutes, zone);
        if (generated.Count == 0)
            return new(date, venue.Timezone, venue.Currency.Trim(), false,
                venue.SlotMinutes, selected.Select(c =>
                    new AvailabilityCourtResponse(c.Id, c.CourtName, [])).ToArray());

        // Query *once* for every court on this day. Including expired-but-still
        // active holds is deliberate: the GiST exclusion still blocks their time.
        var entries = await schedules.ListActiveInRangeAsync(
            generated.Min(s => s.StartUtc), generated.Max(s => s.EndUtc), ct);
        var byCourt = entries.GroupBy(e => e.CourtId)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<CourtScheduleEntry>)g.ToArray());
        var rules = await venues.GetActivePricingRulesAsync(ct);
        var nowUtc = now.UtcDateTime;
        // SQL accepts a large nonnegative notice value. Do not let an extreme
        // configuration overflow DateTimeOffset.AddMinutes; it simply makes
        // every slot in the permitted one-year horizon unavailable.
        var firstBookableUtc = venue.MinimumNoticeMinutes >= 525600
            ? DateTime.MaxValue
            : now.AddMinutes(venue.MinimumNoticeMinutes).UtcDateTime;
        var result = selected.Select(c =>
        {
            byCourt.TryGetValue(c.Id, out var courtEntries);
            var slots = generated.Select(slot =>
            {
                var status = AvailabilityCalculator.GetStatus(
                    slot.StartUtc, slot.EndUtc, nowUtc, firstBookableUtc,
                    true,
                    courtEntries ?? []);
                return new AvailabilitySlotResponse(
                    slot.Start, slot.End,
                    new DateTimeOffset(slot.StartUtc, TimeSpan.Zero),
                    new DateTimeOffset(slot.EndUtc, TimeSpan.Zero),
                    status, PricingCalculator.Calculate(c, date, slot.Start, slot.End, rules));
            }).ToArray();
            return new AvailabilityCourtResponse(c.Id, c.CourtName, slots);
        }).ToArray();

        return new(date, venue.Timezone, venue.Currency.Trim(), false,
            venue.SlotMinutes, result);
    }

    public async Task<PriceQuoteResponse?> GetQuoteAsync(
        DateOnly date, long courtId, TimeOnly start, CancellationToken ct)
    {
        var day = await GetDayAsync(date, courtId, ct);
        var court = day.Courts.SingleOrDefault(c => c.CourtId == courtId);
        var slot = court?.Slots.SingleOrDefault(s => s.StartsAt == start);
        return slot is null ? null : new PriceQuoteResponse(date, courtId, slot.StartsAt,
            slot.EndsAt, day.Currency, slot.TotalPrice, slot.Status);
    }
}
