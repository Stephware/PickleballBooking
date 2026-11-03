using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class CourtScheduleEntryConfiguration : IEntityTypeConfiguration<CourtScheduleEntry>
{
    public void Configure(EntityTypeBuilder<CourtScheduleEntry> builder)
    {
        builder.ToTable("court_schedule_entries");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.CourtId).HasColumnName("court_id").HasColumnType("bigint");
        builder.Property(e => e.EntryType).HasColumnName("entry_type").HasColumnType("character varying(16)").IsRequired();
        builder.Property(e => e.Status).HasColumnName("status").HasColumnType("character varying(24)").IsRequired();
        builder.Property(e => e.StartsAt).HasColumnName("starts_at").HasColumnType("timestamp with time zone");
        builder.Property(e => e.EndsAt).HasColumnName("ends_at").HasColumnType("timestamp with time zone");
        builder.Property(e => e.ExpiresAt).HasColumnName("expires_at").HasColumnType("timestamp with time zone");
        builder.Property(e => e.BlockReason).HasColumnName("block_reason").HasColumnType("text");
        builder.Property(e => e.CreatedByStaffId).HasColumnName("created_by_staff_id").HasColumnType("bigint");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.HasOne<Court>().WithMany().HasForeignKey(e => e.CourtId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<StaffUser>().WithMany().HasForeignKey(e => e.CreatedByStaffId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(e => new { e.CourtId, e.StartsAt }).HasDatabaseName("ix_schedule_entries_court_start");
        builder.HasIndex(e => e.ExpiresAt).HasDatabaseName("ix_schedule_entries_expiry").HasFilter("status = 'HELD'");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
