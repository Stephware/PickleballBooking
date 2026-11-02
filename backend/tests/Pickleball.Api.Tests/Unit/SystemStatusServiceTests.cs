using Pickleball.Api.Services.System;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class SystemStatusServiceTests
{
    [Fact]
    public void GetStatus_ReturnsNonSensitiveStatusWithInjectedClock()
    {
        var expected = new DateTimeOffset(2026, 11, 3, 0, 0, 0, TimeSpan.Zero);
        var service = new SystemStatusService(new FixedTimeProvider(expected));

        var response = service.GetStatus();

        Assert.Equal("Pickleball.Api", response.Service);
        Assert.Equal("healthy", response.Status);
        Assert.Equal(expected, response.UtcNow);
    }

    private sealed class FixedTimeProvider(DateTimeOffset timestamp) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => timestamp;
    }
}
