namespace Pickleball.Api.Services.Pricing;

/// <summary>Validates the PostgreSQL numeric(10,2) rate boundary before saving.</summary>
public static class MoneyRules
{
    public static bool IsValidRate(decimal amount) =>
        amount >= 0m && amount <= 99999999.99m &&
        decimal.Round(amount, 2) == amount;
}
