namespace Api.DTO;

public sealed record TurbineAlertDto(
    string TurbineId,
    string FarmId,
    DateTimeOffset Timestamp,
    string Severity,
    string Message
);