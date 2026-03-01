namespace Api.DTO;

public sealed record StartCommandDto(
    string Action // "start"
);

public sealed record StopCommandDto(
    string Action,     // "stop"
    string? Reason
);

public sealed record SetPitchCommandDto(
    string Action, // "setPitch"
    double Angle   // 0..30
);
