using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Pickleball.Api.Data;
using Pickleball.Api.Models.Entities;
using Xunit;

namespace Pickleball.Api.Tests.Unit;

public sealed class DatabaseModelMappingTests
{
    private static PickleballDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<PickleballDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused;Password=unused")
            .Options; // Model metadata only; no network or database required.
        return new PickleballDbContext(options);
    }

    [Fact]
    public void AllNineSqlTables_AreMapped()
    {
        using var db = CreateContext();
        var actual = db.Model.GetEntityTypes()
            .Select(e => e.GetTableName())
            .OrderBy(name => name)
            .ToArray();
        var expected = new[]
        {
            "venue_settings", "staff_users", "courts", "operating_hours",
            "pricing_rules", "customers", "court_schedule_entries",
            "bookings", "payments"
        }.OrderBy(name => name).ToArray();

        Assert.Equal(expected, actual);
    }

    [Fact]
    public void CoreMappings_MatchOriginalSql()
    {
        using var db = CreateContext();

        Assert.Equal("numeric(10,2)", db.Model.FindEntityType(typeof(Court))!
            .FindProperty(nameof(Court.BaseHourlyRate))!.GetColumnType());
        Assert.Equal("timestamp with time zone", db.Model.FindEntityType(typeof(CourtScheduleEntry))!
            .FindProperty(nameof(CourtScheduleEntry.StartsAt))!.GetColumnType());
        Assert.Equal("time without time zone", db.Model.FindEntityType(typeof(OperatingHour))!
            .FindProperty(nameof(OperatingHour.OpensAt))!.GetColumnType());
        Assert.Equal("character varying(20)", db.Model.FindEntityType(typeof(Booking))!
            .FindProperty(nameof(Booking.BookingCode))!.GetColumnType());
        Assert.Equal("bigint", db.Model.FindEntityType(typeof(Payment))!
            .FindProperty(nameof(Payment.Id))!.GetColumnType());
    }

    [Fact]
    public void CourtBookingRelationship_UsesExistingForeignKey()
    {
        using var db = CreateContext();

        var entity = db.Model.FindEntityType(typeof(Booking))!;
        var scheduleFk = entity.GetForeignKeys().Single(fk =>
            fk.Properties.Single().Name == nameof(Booking.ScheduleEntryId));

        Assert.Equal(typeof(CourtScheduleEntry), scheduleFk.PrincipalEntityType.ClrType);
        Assert.Equal(DeleteBehavior.Restrict, scheduleFk.DeleteBehavior);
    }
}
