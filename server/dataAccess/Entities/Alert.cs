namespace dataAccess.Entities;

public sealed class Alert
{
    public long Id { get; set; }

    public Guid FarmId { get; set; }
    public Guid? TurbineId { get; set; }

    public DateTimeOffset Ts { get; set; }
    public DateTimeOffset ReceivedAt { get; set; } = DateTimeOffset.UtcNow;

    public short Severity { get; set; }
    public string? Code { get; set; }
    public string Message { get; set; } = "";

    public bool IsActive { get; set; } = true;
    public DateTimeOffset? ClearedAt { get; set; }

    public string PayloadJson { get; set; } = "{}";

    public Farm Farm { get; set; } = null!;
    public Turbine? Turbine { get; set; }
}