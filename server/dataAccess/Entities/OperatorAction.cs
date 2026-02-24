namespace dataAccess.Entities;

public sealed class OperatorAction
{
    public Guid Id { get; set; }

    public Guid FarmId { get; set; }
    public Guid TurbineId { get; set; }

    public Guid? UserId { get; set; }

    public string CommandType { get; set; } = "";
    public string PayloadJson { get; set; } = "{}";

    public DateTimeOffset RequestedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? SentAt { get; set; }
    public DateTimeOffset? AcknowledgedAt { get; set; }

    public string Status { get; set; } = "Requested";
    public string? ValidationError { get; set; }

    public string? MqttTopic { get; set; }
    public string? MqttMessageId { get; set; }

    public AppUser? User { get; set; }
    public Turbine Turbine { get; set; } = null!;
}