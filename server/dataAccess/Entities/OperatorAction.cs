using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace dataAccess.Entities;

public sealed class OperatorAction
{
    public Guid Id { get; set; }

    public Guid FarmId { get; set; }

    [MaxLength(200)]
    public string TurbineId { get; set; } = "";

    public Guid UserId { get; set; }  

    [MaxLength(50)]
    public string Action { get; set; } = "";

    [Column(TypeName = "jsonb")]
    public string PayloadJson { get; set; } = "{}";

    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;

    [MaxLength(30)]
    public string Status { get; set; } = "Requested";

    public string? ValidationError { get; set; }

    public AppUser User { get; set; } = null!;
    public Turbine Turbine { get; set; } = null!;
}