namespace dataAccess.Entities;

public sealed class TelemetryRecord
{
    public long Id { get; set; }

    public Guid FarmId { get; set; }
    public Guid TurbineId { get; set; }

    public DateTimeOffset Ts { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;

    public double? WindSpeedMs { get; set; }
    public double? WindDirectionDeg { get; set; }
    public double? AirTemperatureC { get; set; }

    public double? PowerKw { get; set; }
    public double? RotorRpm { get; set; }
    public double? BladePitchDeg { get; set; }
    public bool? IsRunning { get; set; }
    public int? ReportingIntervalMs { get; set; }

    public string PayloadJson { get; set; } = "{}";

    public Turbine Turbine { get; set; } = null!;
}