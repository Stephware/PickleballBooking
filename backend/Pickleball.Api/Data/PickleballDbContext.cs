using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data;

/// <summary>
/// Maps the PostgreSQL schema in database/sql/01_schema.sql. Never calls EnsureCreated
/// or Migrate on app startup. The SQL-first schema is already installed.
/// </summary>
public sealed class PickleballDbContext(DbContextOptions<PickleballDbContext> options) : DbContext(options)
{
    public DbSet<VenueSettings> VenueSettings => Set<VenueSettings>();
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<Court> Courts => Set<Court>();
    public DbSet<OperatingHour> OperatingHours => Set<OperatingHour>();
    public DbSet<PricingRule> PricingRules => Set<PricingRule>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CourtScheduleEntry> CourtScheduleEntries => Set<CourtScheduleEntry>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Don't invent extra EF convention indexes that aren't in SQL-first schema.
        configurationBuilder.Conventions.Remove(typeof(ForeignKeyIndexConvention));
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("public");
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PickleballDbContext).Assembly);
    }
}
