namespace Api.DTO;

public sealed record SetPitchCommandDto(
    string Action, // "setPitch"
    double Angle   // 0..30
);