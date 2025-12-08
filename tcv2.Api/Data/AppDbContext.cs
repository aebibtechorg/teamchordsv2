using System;
using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<ChordSheet> ChordSheets { get; set; } = null!;
        public DbSet<Invite> Invites { get; set; } = null!;
        public DbSet<Organization> Organizations { get; set; } = null!;
        public DbSet<Output> Outputs { get; set; } = null!;
        public DbSet<Profile> Profiles { get; set; } = null!;
        public DbSet<SetList> SetLists { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Organization -> SetLists (one-to-many)
            modelBuilder.Entity<SetList>()
                .HasOne(s => s.Organization)
                .WithMany()
                .HasForeignKey(s => s.OrgId)
                .OnDelete(DeleteBehavior.Restrict);

            // Organization -> ChordSheets (one-to-many)
            modelBuilder.Entity<ChordSheet>()
                .HasOne(c => c.Organization)
                .WithMany()
                .HasForeignKey(c => c.OrgId)
                .OnDelete(DeleteBehavior.Restrict);

            // SetList -> Outputs (one-to-many)
            modelBuilder.Entity<Output>()
                .HasOne(o => o.SetList)
                .WithMany(s => s.Outputs)
                .HasForeignKey(o => o.SetListId)
                .OnDelete(DeleteBehavior.Cascade);

            // ChordSheet -> Outputs (one-to-many)
            modelBuilder.Entity<Output>()
                .HasOne(o => o.ChordSheet)
                .WithMany()
                .HasForeignKey(o => o.ChordSheetId)
                .OnDelete(DeleteBehavior.Cascade);

            // NOTE: legacy `OrgId`/single-Organization mapping removed. Users now relate to organizations via many-to-many `UserOrganizations`.

            // User <-> Organization (many-to-many)
            modelBuilder.Entity<User>()
                .HasMany(u => u.Organizations)
                .WithMany(o => o.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserOrganization",
                    j => j.HasOne<Organization>().WithMany().HasForeignKey("OrganizationId").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId").OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("UserId", "OrganizationId");
                        j.HasIndex("OrganizationId");
                        j.ToTable("UserOrganizations");
                    }
                );

            // Profile -> User (one-to-one)
            modelBuilder.Entity<Profile>()
                .HasOne<User>()
                .WithOne(u => u.Profile)
                .HasForeignKey<Profile>(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Invite -> User (invited_by) (many invites by user)
            modelBuilder.Entity<Invite>()
                .HasOne<User>()
                .WithMany()
                .HasForeignKey(i => i.InvitedBy)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invite>()
                .HasOne(i => i.Organization)
                .WithMany()
                .HasForeignKey(i => i.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
