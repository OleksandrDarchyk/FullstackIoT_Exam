using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace dataAccess.Entities;

public sealed class TelemetryRecord
{
    public long Id { get; set; }

    [MaxLength(200)]
    public string FarmId { get; set; } = "";

    [MaxLength(200)]
    public string TurbineId { get; set; } = "";

    public DateTimeOffset Ts { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;

    public double? WindSpeed { get; set; }
    public double? WindDirection { get; set; }
    public double? AmbientTemperature { get; set; }

    public double? RotorSpeed { get; set; }
    public double? PowerOutput { get; set; }
    public double? NacelleDirection { get; set; }

    public double? BladePitch { get; set; }
    public double? GeneratorTemp { get; set; }
    public double? GearboxTemp { get; set; }
    public double? Vibration { get; set; }

    public string? Status { get; set; } // "running"/"stopped"

    [Column(TypeName = "jsonb")]
    public string PayloadJson { get; set; } = "{}";

    public Turbine Turbine { get; set; } = null!;
}