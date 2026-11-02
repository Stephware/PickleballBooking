namespace Pickleball.Api.DTOs.Availability;

// All times are venue-local for display. UTC instants are included to avoid
// browser timezone guesses. No customer, payment, or booking identifiers leak.
public sealed record AvailabilityDayResponse(
    DateOnly Date, string Timezone, string Currency, bool IsClosed,
    int SlotMinutes, IReadOnlyList<AvailabilityCourtResponse> Courts);

public sealed record AvailabilityCourtResponse(
    long CourtId, string CourtName, IReadOnlyList<AvailabilitySlotResponse> Slots);

public sealed record AvailabilitySlotResponse(
    TimeOnly StartsAt, TimeOnly EndsAt,
    DateTimeOffset StartsAtUtc, DateTimeOffset EndsAtUtc,
    string Status, decimal TotalPrice);

public sealed record PriceQuoteResponse(
    DateOnly Date, long CourtId, TimeOnly StartsAt, TimeOnly EndsAt,
    string Currency, decimal TotalPrice, string AvailabilityStatus);
