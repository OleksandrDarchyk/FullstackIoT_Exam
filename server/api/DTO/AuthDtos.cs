using System.ComponentModel.DataAnnotations;

namespace Api.DTO;

public sealed record RegisterRequestDto(
    [property: Required, MinLength(3), MaxLength(200)] string Username,
    [property: Required, MinLength(6), MaxLength(200)] string Password
);

public sealed record LoginRequestDto(
    [property: Required, MinLength(3), MaxLength(200)] string Username,
    [property: Required, MinLength(6), MaxLength(200)] string Password
);

public sealed record AuthResponseDto(
    Guid UserId,
    string Username,
    string Role,
    string Token
);