using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace dataAccess.Entities;

public sealed class Turbine
{
    [MaxLength(200)]
    public string FarmId { get; set; } = "";

    [MaxLength(200)]
    public string TurbineId { get; set; } = ""; // "turbine-alpha"

    [MaxLength(200)]
    public string? Name { get; set; } // "Alpha"

    [MaxLength(200)]
    public string? Location { get; set; } // "North Platform"

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public Farm Farm { get; set; } = null!;
    public ICollection<TelemetryRecord> Telemetry { get; set; } = new List<TelemetryRecord>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    public ICollection<OperatorAction> OperatorActions { get; set; } = new List<OperatorAction>();
}