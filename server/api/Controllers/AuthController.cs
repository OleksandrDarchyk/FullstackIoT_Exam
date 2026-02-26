using Api.DTO;
using Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public Task<AuthResponseDto> Register([FromBody] RegisterRequestDto dto, CancellationToken ct)
        => auth.Register(dto, ct);

    [HttpPost("login")]
    public Task<AuthResponseDto> Login([FromBody] LoginRequestDto dto, CancellationToken ct)
        => auth.Login(dto, ct);
}