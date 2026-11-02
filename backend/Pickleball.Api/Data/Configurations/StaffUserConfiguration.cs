using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Pickleball.Api.Models.Entities;

namespace Pickleball.Api.Data.Configurations;

public sealed class StaffUserConfiguration : IEntityTypeConfiguration<StaffUser>
{
    public void Configure(EntityTypeBuilder<StaffUser> builder)
    {
        builder.ToTable("staff_users");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).HasColumnName("id").HasColumnType("bigint").UseIdentityAlwaysColumn();
        builder.Property(e => e.FullName).HasColumnName("full_name").HasColumnType("character varying(150)").IsRequired();
        builder.Property(e => e.Email).HasColumnName("email").HasColumnType("character varying(254)").IsRequired();
        builder.Property(e => e.PasswordHash).HasColumnName("password_hash").HasColumnType("text").IsRequired();
        builder.Property(e => e.Role).HasColumnName("role").HasColumnType("character varying(16)").IsRequired().HasDefaultValue("STAFF");
        builder.Property(e => e.IsActive).HasColumnName("is_active").HasColumnType("boolean").HasDefaultValue(true);
        builder.Property(e => e.CreatedAt).HasColumnName("created_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        builder.Property(e => e.UpdatedAt).HasColumnName("updated_at").HasColumnType("timestamp with time zone").HasDefaultValueSql("NOW()");
        // SQL-only objects (functional indexes, exclusion constraints and triggers)
        // remain authoritative in database/sql/01_schema.sql.
    }
}
