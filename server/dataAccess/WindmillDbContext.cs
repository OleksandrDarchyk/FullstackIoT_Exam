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
        modelBuilder.Entity<AppUser>(e =>
        {
            e.ToTable("app_user");
            e.HasKey(x => x.Id);

            e.Property(x => x.Username).IsRequired();
            e.HasIndex(x => x.Username).IsUnique();
        });

        modelBuilder.Entity<Farm>(e =>
        {
            e.ToTable("farm");
            e.HasKey(x => x.Id);
        });

        modelBuilder.Entity<Turbine>(e =>
        {
            e.ToTable("turbine");

            // Natural key from MQTT: (farmId + turbineId)
            e.HasKey(x => new { x.FarmId, x.TurbineId });

            e.Property(x => x.TurbineId).IsRequired();

            e.HasOne(x => x.Farm)
                .WithMany(f => f.Turbines)
                .HasForeignKey(x => x.FarmId);

            e.HasIndex(x => x.FarmId);
        });

        modelBuilder.Entity<TelemetryRecord>(e =>
        {
            e.ToTable("telemetry");
            e.HasKey(x => x.Id);

            e.Property(x => x.TurbineId).IsRequired();

            e.HasOne(x => x.Turbine)
                .WithMany(t => t.Telemetry)
                .HasForeignKey(x => new { x.FarmId, x.TurbineId });

            // for charts
            e.HasIndex(x => new { x.FarmId, x.TurbineId, x.Ts });
            e.HasIndex(x => new { x.FarmId, x.Ts });
        });

        modelBuilder.Entity<Alert>(e =>
        {
            e.ToTable("alert");
            e.HasKey(x => x.Id);

            e.Property(x => x.Severity).IsRequired();
            e.Property(x => x.Message).IsRequired();

            e.HasOne(x => x.Farm)
                .WithMany(f => f.Alerts)
                .HasForeignKey(x => x.FarmId);

            // optional turbine relation (works when TurbineId != null)
            e.HasOne(x => x.Turbine)
                .WithMany(t => t.Alerts)
                .HasForeignKey(x => new { x.FarmId, x.TurbineId })
                .IsRequired(false);

            e.HasIndex(x => new { x.FarmId, x.Ts });
            e.HasIndex(x => new { x.FarmId, x.TurbineId, x.Ts });
            e.HasIndex(x => new { x.FarmId, x.Severity, x.Ts });
        });

        modelBuilder.Entity<OperatorAction>(e =>
        {
            e.ToTable("operator_action");
            e.HasKey(x => x.Id);

            e.Property(x => x.Action).IsRequired();
            e.Property(x => x.Status).IsRequired();
            e.Property(x => x.TurbineId).IsRequired();

            e.HasOne(x => x.User)
                .WithMany(u => u.OperatorActions)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Turbine)
                .WithMany(t => t.OperatorActions)
                .HasForeignKey(x => new { x.FarmId, x.TurbineId });

            e.HasIndex(x => new { x.FarmId, x.TurbineId, x.RequestedAt });
            e.HasIndex(x => new { x.UserId, x.RequestedAt });
        });
    }
}