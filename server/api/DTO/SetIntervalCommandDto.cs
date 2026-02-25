namespace Api.DTO;

public sealed record StopCommandDto(
    string Action,     // "stop"
    string? Reason
);