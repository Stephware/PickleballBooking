using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class OperatingHourConfiguration : IEntityTypeConfiguration<OperatingHour>
{
    public void Configure(EntityTypeBuilder<OperatingHour> builder)
    {
        builder.ToTable("operating_hours");
        builder.HasKey(e => e.DayOfWeek);
        builder.Property(e => e.DayOfWeek).HasColumnName("day_of_week").HasColumnType("smallint").ValueGeneratedNever();
        builder.Property(e => e.IsClosed).HasColumnName("is_closed").HasColumnType("boolean").HasDefaultValue(false);
        builder.Property(e => e.OpensAt).HasColumnName("opens_at").HasColumnType("time without time zone");
        builder.Property(e => e.ClosesAt).HasColumnName("closes_at").HasColumnType("time without time zone");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
