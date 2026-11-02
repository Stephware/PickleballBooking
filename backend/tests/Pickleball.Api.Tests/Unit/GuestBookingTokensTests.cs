using Microsoft.Extensions.Configuration;
using Pickleball.Api.Security;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class GuestBookingTokensTests
{
    private static GuestBookingTokens Create(string key = "test-secret-not-for-production-32-characters-minimum") =>
        new(new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Booking:SigningKey"] = key
        }).Build());

    [Fact]
    public void SameIdempotencyKey_ReturnsSameCode()
    {
        var service = Create();
        var key = Guid.Parse("3f81f7f2-ea65-4c6d-8f3a-865e700eb7ea");
        var code = service.BookingCode(key);
        Assert.StartsWith("PB-", code);
        Assert.Equal(19, code.Length);
        Assert.Equal(code, service.BookingCode(key));
        Assert.NotEqual(code, service.BookingCode(Guid.NewGuid()));
    }

    [Fact]
    public void GuestToken_ValidatesOnlyMatchingBooking()
    {
        var service = Create();
        var code = service.BookingCode(Guid.NewGuid());
        var token = service.AccessToken(code);

        Assert.True(service.Verify(code, token));
        Assert.False(service.Verify("PB-0000000000000000", token));
        Assert.False(service.Verify(code, token[..^1] + (token[^1] == 'X' ? "Y" : "X")));
        Assert.False(service.Verify(code, null));
        Assert.False(service.Verify("not-a-code", token));
    }

    [Fact]
    public void SameIdempotencyKey_DifferentVenueSecret_HasDifferentCodeAndToken()
    {
        var id = Guid.NewGuid();
        var a = Create("venue-a-very-long-persistent-private-32-byte-secret");
        var b = Create("venue-b-another-long-persistent-private-secret-32");
        Assert.NotEqual(a.BookingCode(id), b.BookingCode(id));
        var code = a.BookingCode(id);
        Assert.False(b.Verify(code, a.AccessToken(code)));
    }

    [Fact]
    public void MissingOrWeakSigningKey_RejectsCreation()
    {
        var service = Create("weak");
        Assert.Throws<InvalidOperationException>(() => service.BookingCode(Guid.NewGuid()));
    }
}
