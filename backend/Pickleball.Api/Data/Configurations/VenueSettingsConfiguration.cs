using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class VenueSettingsConfiguration : IEntityTypeConfiguration<VenueSettings>
{
    public void Configure(EntityTypeBuilder<VenueSettings> builder)
    {
        builder.ToTable("venue_settings");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("smallint").ValueGeneratedNever().HasDefaultValue(1);
        builder.Property(e => e.VenueName).HasColumnName("venue_name").HasColumnType("character varying(150)").IsRequired();
        builder.Property(e => e.VenueSlug).HasColumnName("venue_slug").HasColumnType("character varying(100)").IsRequired();
        builder.Property(e => e.Timezone).HasColumnName("timezone").HasColumnType("character varying(64)").IsRequired().HasDefaultValue("Asia/Manila");
        builder.Property(e => e.Currency).HasColumnName("currency").HasColumnType("character(3)").IsRequired().HasDefaultValue("PHP");
        builder.Property(e => e.LogoUrl).HasColumnName("logo_url").HasColumnType("text");
        builder.Property(e => e.PrimaryColor).HasColumnName("primary_color").HasColumnType("character(7)").IsRequired().HasDefaultValue("#16805D");
        builder.Property(e => e.SecondaryColor).HasColumnName("secondary_color").HasColumnType("character(7)").IsRequired().HasDefaultValue("#F2F7F4");
        builder.Property(e => e.SlotMinutes).HasColumnName("slot_minutes").HasColumnType("integer").HasDefaultValue(60);
        builder.Property(e => e.HoldMinutes).HasColumnName("hold_minutes").HasColumnType("integer").HasDefaultValue(10);
        builder.Property(e => e.ReviewTimeoutHours).HasColumnName("review_timeout_hours").HasColumnType("integer").HasDefaultValue(4);
        builder.Property(e => e.BookingAdvanceDays).HasColumnName("booking_advance_days").HasColumnType("integer").HasDefaultValue(30);
        builder.Property(e => e.MinimumNoticeMinutes).HasColumnName("minimum_notice_minutes").HasColumnType("integer").HasDefaultValue(30);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
