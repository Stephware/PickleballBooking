using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> builder)
    {
        builder.ToTable("courts");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.CourtName).HasColumnName("court_name").HasColumnType("character varying(100)").IsRequired();
        builder.Property(e => e.Description).HasColumnName("description").HasColumnType("text");
        builder.Property(e => e.BaseHourlyRate).HasColumnName("base_hourly_rate").HasColumnType("numeric(10,2)");
        builder.Property(e => e.DisplayOrder).HasColumnName("display_order").HasColumnType("integer").HasDefaultValue(0);
        builder.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("boolean").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
