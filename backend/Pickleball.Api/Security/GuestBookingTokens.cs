using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Pickleball.Api.Security;

/// <summary>
/// Stateless guest bearer access and idempotency using independently domain-
/// separated HMACs. The 32+-byte per-venue signing secret MUST be persistent.
/// Rotating it invalidates old access tokens and idempotency derivation.
/// </summary>
public sealed class GuestBookingTokens(IConfiguration configuration)
{
    private static readonly Regex CodeFormat =
        new(@"^PB-[0-9A-F]{16}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private byte[] Key()
    {
        var raw = configuration["Booking:SigningKey"];
        if (string.IsNullOrWhiteSpace(raw) || Encoding.UTF8.GetByteCount(raw) < 32)
            throw new InvalidOperationException(
                "Booking:SigningKey must be configured as a persistent random secret (32+ bytes).");
        return Encoding.UTF8.GetBytes(raw);
    }

    private byte[] Sign(string purpose, string value) =>
        HMACSHA256.HashData(Key(), Encoding.UTF8.GetBytes(purpose + ":" + value));

    public string BookingCode(Guid idempotencyKey)
    {
        var hash = Sign("booking-code-v1", idempotencyKey.ToString("N"));
        return "PB-" + Convert.ToHexString(hash.AsSpan(0, 8));
    }

    public string AccessToken(string bookingCode)
    {
        if (!CodeFormat.IsMatch(bookingCode))
            throw new ArgumentException("Invalid booking reference.", nameof(bookingCode));
        return Convert.ToBase64String(Sign("guest-booking-access-v1", bookingCode))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public bool Verify(string bookingCode, string? token)
    {
        if (!CodeFormat.IsMatch(bookingCode) || string.IsNullOrWhiteSpace(token) ||
            token.Length != 43) return false;
        var expected = AccessToken(bookingCode);
        return CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(expected), Encoding.ASCII.GetBytes(token));
    }
}
