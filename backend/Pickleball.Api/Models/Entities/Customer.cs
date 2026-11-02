namespace Pickleball.Api.Models.Entities;

/// <summary>SQL-first mapped row in public.customers.</summary>
public sealed class Customer
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public DateTime CreatedAt { get; set; }
}
