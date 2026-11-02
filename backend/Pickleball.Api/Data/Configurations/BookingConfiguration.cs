using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("bookings");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.BookingCode).HasColumnName("booking_code").HasColumnType("character varying(20)").IsRequired().HasDefaultValueSql("('PB-' || UPPER(LEFT(REPLACE(gen_random_uuid()::TEXT, '-', ''), 16)))");
        builder.Property(e => e.ScheduleEntryId).HasColumnName("schedule_entry_id").HasColumnType("bigint");
        builder.Property(e => e.CustomerId).HasColumnName("customer_id").HasColumnType("bigint");
        builder.Property(e => e.GuestName).HasColumnName("guest_name").HasColumnType("character varying(150)").IsRequired();
        builder.Property(e => e.GuestPhone).HasColumnName("guest_phone").HasColumnType("character varying(32)");
        builder.Property(e => e.GuestEmail).HasColumnName("guest_email").HasColumnType("character varying(254)");
        builder.Property(e => e.Notes).HasColumnName("notes").HasColumnType("text");
        builder.Property(e => e.TotalAmount).HasColumnName("total_amount").HasColumnType("numeric(10,2)");
        builder.Property(e => e.RequiredDeposit).HasColumnName("required_deposit").HasColumnType("numeric(10,2)").HasDefaultValue(0m);
        builder.Property(e => e.CancellationReason).HasColumnName("cancellation_reason").HasColumnType("text");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.HasOne<CourtScheduleEntry>().WithMany().HasForeignKey(e => e.ScheduleEntryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Customer>().WithMany().HasForeignKey(e => e.CustomerId).OnDelete(DeleteBehavior.SetNull);
        builder.HasAlternateKey(e => e.BookingCode).HasName("bookings_booking_code_key");
        builder.HasAlternateKey(e => e.ScheduleEntryId).HasName("bookings_schedule_entry_id_key");
        builder.HasIndex(e => e.CustomerId).HasDatabaseName("ix_bookings_customer_id");
        builder.HasIndex(e => e.GuestPhone).HasDatabaseName("ix_bookings_guest_phone");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
