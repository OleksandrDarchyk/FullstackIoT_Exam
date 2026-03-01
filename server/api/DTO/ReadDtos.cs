namespace Api.DTO;

public sealed record TurbineAlertDto(
    string TurbineId,
    string FarmId,
    DateTimeOffset Timestamp,
    string Severity,
    string Message
);

public sealed record TurbineTelemetryDto(
    string TurbineId,
    string TurbineName,
    string FarmId,
    DateTimeOffset Timestamp,
    double WindSpeed,
    double WindDirection,
    double AmbientTemperature,
    double RotorSpeed,
    double PowerOutput,
    double NacelleDirection,
    double BladePitch,
    double GeneratorTemp,
    double GearboxTemp,
    double Vibration,
    string Status
);

public sealed record TurbineDto(string TurbineId, string? Name, string? Location);

public sealed record TelemetryPointDto(
    string TurbineId,
    DateTimeOffset Ts,
    double? WindSpeed,
    double? WindDirection,
    double? AmbientTemperature,
    double? PowerOutput,
    double? RotorSpeed,
    double? NacelleDirection,
    double? GeneratorTemp,
    double? GearboxTemp,
    double? Vibration,
    double? BladePitch,
    string? Status
);

public sealed record AlertDto(
    long Id,
    string? TurbineId,
    DateTimeOffset Ts,
    string Severity,
    string Message
);

public sealed record OperatorActionDto(
    Guid Id,
    string TurbineId,
    DateTimeOffset RequestedAt,
    string Action,
    string PayloadJson,
    string Status,
    string? ValidationError,
    string Username
);