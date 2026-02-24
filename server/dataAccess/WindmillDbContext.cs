using dataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace dataAccess;

public sealed class WindmillDbContext : DbContext
{
    public WindmillDbContext(DbContextOptions<WindmillDbContext> options) : base(options) { }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Turbine> Turbines => Set<Turbine>();
    public DbSet<TelemetryRecord> Telemetry => Set<TelemetryRecord>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<OperatorAction> OperatorActions => Set<OperatorAction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("Windmill");

        modelBuilder.Entity<AppUser>(e =>
        {
            e.ToTable("app_user");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Username).IsUnique();
        });

        modelBuilder.Entity<Farm>(e =>
        {
            e.ToTable("farm");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ExternalFarmId).IsUnique();
        });

        modelBuilder.Entity<Turbine>(e =>
        {
            e.ToTable("turbine");
            e.HasKey(x => x.Id);

            e.HasOne(x => x.Farm)
                .WithMany(f => f.Turbines)
                .HasForeignKey(x => x.FarmId);

            e.HasIndex(x => new { x.FarmId, x.ExternalTurbineId }).IsUnique();

            e.HasAlternateKey(x => new { x.Id, x.FarmId });
            e.HasIndex(x => x.FarmId);
        });

        modelBuilder.Entity<TelemetryRecord>(e =>
        {
            e.ToTable("telemetry");
            e.HasKey(x => x.Id);

            e.Property(x => x.PayloadJson).HasColumnType("jsonb");

            e.HasOne(x => x.Turbine)
                .WithMany(t => t.Telemetry)
                .HasForeignKey(x => new { x.TurbineId, x.FarmId })
                .HasPrincipalKey(t => new { t.Id, t.FarmId });

            e.HasIndex(x => new { x.TurbineId, x.Ts });
            e.HasIndex(x => new { x.FarmId, x.Ts });
        });

        modelBuilder.Entity<Alert>(e =>
        {
            e.ToTable("alert");
            e.HasKey(x => x.Id);

            e.Property(x => x.PayloadJson).HasColumnType("jsonb");

            e.HasOne(x => x.Farm)
                .WithMany(f => f.Alerts)
                .HasForeignKey(x => x.FarmId);

            e.HasOne(x => x.Turbine)
                .WithMany(t => t.Alerts)
                .HasForeignKey(x => x.TurbineId);

            e.HasIndex(x => new { x.TurbineId, x.Ts });
            e.HasIndex(x => new { x.IsActive, x.Severity, x.Ts });
        });

        modelBuilder.Entity<OperatorAction>(e =>
        {
            e.ToTable("operator_command");
            e.HasKey(x => x.Id);

            e.Property(x => x.PayloadJson).HasColumnType("jsonb");

            e.HasOne(x => x.User)
                .WithMany(u => u.OperatorActions)
                .HasForeignKey(x => x.UserId);

            e.HasOne(x => x.Turbine)
                .WithMany(t => t.OperatorActions)
                .HasForeignKey(x => new { x.TurbineId, x.FarmId })
                .HasPrincipalKey(t => new { t.Id, t.FarmId });

            e.HasIndex(x => new { x.TurbineId, x.RequestedAt });
            e.HasIndex(x => new { x.UserId, x.RequestedAt });
        });
    }
}