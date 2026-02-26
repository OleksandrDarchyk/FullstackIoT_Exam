namespace Api.DTO;

public sealed record TurbineDto(string TurbineId, string? Name, string? Location);

public sealed record TelemetryPointDto(
    string TurbineId,
    DateTimeOffset Ts,
    double? WindSpeed,
    double? PowerOutput,
    double? RotorSpeed,
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
    string Status,
    string? ValidationError
);