using Pickleball.Api.Services.Pricing;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class MoneyRulesTests
{
    [Theory]
    [InlineData("0", true)]
    [InlineData("250.00", true)]
    [InlineData("99999999.99", true)]
    [InlineData("-1", false)]
    [InlineData("10.005", false)]
    [InlineData("100000000", false)]
    public void RateMustFitPostgresNumeric10Scale2(string value, bool expected) =>
        Assert.Equal(expected, MoneyRules.IsValidRate(decimal.Parse(
            value, System.Globalization.CultureInfo.InvariantCulture)));
}
