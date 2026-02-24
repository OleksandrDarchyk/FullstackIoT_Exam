using System.ComponentModel.DataAnnotations;

namespace dataAccess.Entities;

public sealed class Turbine
{
    public Guid Id { get; set; }

    public Guid FarmId { get; set; }

    [MaxLength(200)]
    public string ExternalTurbineId { get; set; } = "";

    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Farm Farm { get; set; } = null!;

    public ICollection<TelemetryRecord> Telemetry { get; set; } = new List<TelemetryRecord>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<OperatorAction> OperatorActions { get; set; } = new List<OperatorAction>();
}