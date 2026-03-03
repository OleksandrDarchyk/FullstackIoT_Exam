using System.ComponentModel.DataAnnotations;

namespace Api.DTO;

public sealed record CommandRequestDto(
    [property: Required] string Action,   // "start" | "stop" | "setInterval" | "setPitch"
    int?    Value,              // setInterval: 1..60
    double? Angle,              // setPitch: 0..30
    string? Reason              // stop: optional
);
