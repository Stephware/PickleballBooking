using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class PricingRuleConfiguration : IEntityTypeConfiguration<PricingRule>
{
    public void Configure(EntityTypeBuilder<PricingRule> builder)
    {
        builder.ToTable("pricing_rules");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.CourtId).HasColumnName("court_id").HasColumnType("bigint");
        builder.Property(e => e.RuleName).HasColumnName("rule_name").HasColumnType("character varying(120)").IsRequired();
        builder.Property(e => e.DayOfWeek).HasColumnName("day_of_week").HasColumnType("smallint");
        builder.Property(e => e.StartsAt).HasColumnName("starts_at").HasColumnType("time without time zone");
        builder.Property(e => e.EndsAt).HasColumnName("ends_at").HasColumnType("time without time zone");
        builder.Property(e => e.HourlyRate).HasColumnName("hourly_rate").HasColumnType("numeric(10,2)");
        builder.Property(e => e.Priority).HasColumnName("priority").HasColumnType("integer").HasDefaultValue(0);
        builder.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("boolean").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.HasOne<Court>().WithMany().HasForeignKey(e => e.CourtId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(e => new { e.CourtId, e.DayOfWeek, e.IsActive, e.Priority }).HasDatabaseName("ix_pricing_rules_lookup").IsDescending(false, false, false, true);
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
