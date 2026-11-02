namespace Pickleball.Api.Services.Availability;

/// <summary>
/// Resolves venue-local wall-clock slots into UTC instants.
/// Ambiguous or invalid DST intervals are omitted (fail closed), never offered
/// with an invented UTC offset. Regular overnight hours aren't supported.
/// </summary>
public static class LocalTimeSlots
{
    public readonly record struct Slot(
        TimeOnly Start, TimeOnly End, DateTime StartUtc, DateTime EndUtc);

    public static IReadOnlyList<Slot> Generate(
        DateOnly date, TimeOnly opens, TimeOnly closes, int durationMinutes,
        TimeZoneInfo zone)
    {
        if (durationMinutes <= 0 || opens >= closes)
            return [];

        var first = date.ToDateTime(opens);
        var last = date.ToDateTime(closes);
        var results = new List<Slot>();
        for (var at = first; at.AddMinutes(durationMinutes) <= last;
             at = at.AddMinutes(durationMinutes))
        {
            var until = at.AddMinutes(durationMinutes);
            if (zone.IsInvalidTime(at) || zone.IsAmbiguousTime(at) ||
                zone.IsInvalidTime(until) || zone.IsAmbiguousTime(until))
                continue;
            var startUtc = TimeZoneInfo.ConvertTimeToUtc(at, zone);
            var endUtc = TimeZoneInfo.ConvertTimeToUtc(until, zone);
            if (startUtc >= endUtc) continue;
            results.Add(new(TimeOnly.FromDateTime(at), TimeOnly.FromDateTime(until),
                startUtc, endUtc));
        }
        return results;
    }
}
