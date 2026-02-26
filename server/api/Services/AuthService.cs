using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using dataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto> Register(RegisterRequestDto dto, CancellationToken ct);
    Task<AuthResponseDto> Login(LoginRequestDto dto, CancellationToken ct);
}

public sealed class AuthService(
    WindmillDbContext db,
    PasswordHashService passwordHash,
    JwtService jwt
) : IAuthService
{
    public async Task<AuthResponseDto> Register(RegisterRequestDto dto, CancellationToken ct)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);

        var exists = await db.Users.AnyAsync(x => x.Username == dto.Username, ct);
        if (exists)
            throw new ValidationException("Username already exists");

        var (hash, salt) = passwordHash.Hash(dto.Password);

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            PasswordHash = hash,
            PasswordSalt = salt,
            Role = "Operator",
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        var token = jwt.GenerateToken(user.Id, user.Role);

        return new AuthResponseDto(user.Id, user.Username, user.Role, token);
    }

    public async Task<AuthResponseDto> Login(LoginRequestDto dto, CancellationToken ct)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);

        var user = await db.Users.FirstOrDefaultAsync(x => x.Username == dto.Username, ct);
        if (user is null)
            throw new UnauthorizedAccessException("Invalid username or password");

        var ok = passwordHash.Verify(dto.Password, user.PasswordSalt, user.PasswordHash);
        if (!ok)
            throw new UnauthorizedAccessException("Invalid username or password");

        var token = jwt.GenerateToken(user.Id, user.Role);

        return new AuthResponseDto(user.Id, user.Username, user.Role, token);
    }
}