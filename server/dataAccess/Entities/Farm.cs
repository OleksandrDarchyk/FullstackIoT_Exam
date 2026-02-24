using System.ComponentModel.DataAnnotations;

namespace dataAccess.Entities;

public sealed class Farm
{
    public Guid Id { get; set; }

    [MaxLength(200)]
    public string ExternalFarmId { get; set; } = "";

    [MaxLength(200)]
    public string? Name { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<Turbine> Turbines { get; set; } = new List<Turbine>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}