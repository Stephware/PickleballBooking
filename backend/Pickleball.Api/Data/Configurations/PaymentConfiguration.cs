using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("payments");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.BookingId).HasColumnName("booking_id").HasColumnType("bigint");
        builder.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasColumnType("character varying(24)").IsRequired();
        builder.Property(e => e.Amount).HasColumnName("amount").HasColumnType("numeric(10,2)");
        builder.Property(e => e.Status).HasColumnName("status").HasColumnType("character varying(16)").IsRequired().HasDefaultValue("SUBMITTED");
        builder.Property(e => e.TransactionReference).HasColumnName("transaction_reference").HasColumnType("character varying(150)");
        builder.Property(e => e.ProofStorageKey).HasColumnName("proof_storage_key").HasColumnType("text");
        builder.Property(e => e.SubmittedAt).HasColumnName("submitted_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.ReviewedAt).HasColumnName("reviewed_at").HasColumnType("timestamp with time zone");
        builder.Property(e => e.ReviewedByStaffId).HasColumnName("reviewed_by_staff_id").HasColumnType("bigint");
        builder.Property(e => e.Notes).HasColumnName("notes").HasColumnType("text");
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.HasOne<Booking>().WithMany().HasForeignKey(e => e.BookingId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<StaffUser>().WithMany().HasForeignKey(e => e.ReviewedByStaffId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(e => e.BookingId).HasDatabaseName("ix_payments_booking_id");
        builder.HasIndex(e => e.Status).HasDatabaseName("ix_payments_status");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
