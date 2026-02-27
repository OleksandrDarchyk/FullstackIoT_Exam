using System.ComponentModel.DataAnnotations;

namespace Api.DTO;

public sealed record RegisterRequestDto(
    [Required, MinLength(3), MaxLength(200)] string Username,
    [Required, MinLength(6), MaxLength(200)] string Password
);

public sealed record LoginRequestDto(
    [Required, MinLength(3), MaxLength(200)] string Username,
    [Required, MinLength(6), MaxLength(200)] string Password
);

public sealed record AuthResponseDto(
    Guid UserId,
    string Username,
    string Role,
    string Token
);