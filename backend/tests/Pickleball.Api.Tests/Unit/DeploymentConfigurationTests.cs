using Microsoft.Extensions.Configuration;
using Pickleball.Api.Extensions;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class DeploymentConfigurationTests
{
    private static Dictionary<string, string?> Valid() => new()
    {
        ["ConnectionStrings:Pickleball"] = "Host=database;Database=venue",
        ["Booking:SigningKey"] = new string('t', 64),
        ["ProofStorage:Directory"] = "/private/venue/proofs",
        ["DataProtection:Directory"] = "/private/venue/keys",
        ["AllowedHosts"] = "booking.example.test;api",
        ["Cors:AllowedOrigins:0"] = "https://booking.example.test"
    };

    [Fact]
    public void AcceptsIndependentlyConfiguredVenue()
    {
        DeploymentConfiguration.ValidateProduction(new ConfigurationBuilder().AddInMemoryCollection(Valid()).Build());
    }

    [Theory]
    [InlineData("ConnectionStrings:Pickleball", "")]
    [InlineData("Booking:SigningKey", "short")]
    [InlineData("ProofStorage:Directory", "relative/uploads")]
    [InlineData("ProofStorage:Directory", "/app/wwwroot/uploads")]
    [InlineData("DataProtection:Directory", "")]
    [InlineData("DataProtection:Directory", "/private/venue/proofs")]
    [InlineData("AllowedHosts", "*")]
    [InlineData("Cors:AllowedOrigins:0", "http://booking.example.test")]
    [InlineData("Cors:AllowedOrigins:0", "https://booking.example.test/path")]
    public void RefusesUnsafeProductionConfiguration(string key, string value)
    {
        var values = Valid();
        values[key] = value;
        Assert.Throws<InvalidOperationException>(() => DeploymentConfiguration.ValidateProduction(
            new ConfigurationBuilder().AddInMemoryCollection(values).Build()));
    }
}
