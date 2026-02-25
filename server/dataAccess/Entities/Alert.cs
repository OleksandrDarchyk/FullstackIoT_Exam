using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace dataAccess.Entities;

public sealed class Alert
{
    public long Id { get; set; }

    public Guid FarmId { get; set; }

    [MaxLength(200)]
    public string? TurbineId { get; set; }

    public DateTimeOffset Ts { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;

    [MaxLength(20)]
    public string Severity { get; set; } = ""; // "warning"

    public string Message { get; set; } = "";

    [Column(TypeName = "jsonb")]
    public string PayloadJson { get; set; } = "{}";

    public Farm Farm { get; set; } = null!;
    public Turbine? Turbine { get; set; }
}