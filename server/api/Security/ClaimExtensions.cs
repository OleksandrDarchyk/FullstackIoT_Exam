using System.Security.Claims;

namespace Api.Security;

public static class ClaimExtensions
{
    // Повертає Guid напряму (зручно для EF / DB)
    public static Guid GetUserId(this ClaimsPrincipal claims)
    {
        var raw =
            claims.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? claims.FindFirst("sub")?.Value
            ?? throw new InvalidOperationException("No user id claim found in token.");

        if (!Guid.TryParse(raw, out var id))
            throw new InvalidOperationException("User id claim is not a valid Guid.");

        return id;
    }

    public static string? GetUserRole(this ClaimsPrincipal claims) =>
        claims.FindFirst(ClaimTypes.Role)?.Value
        ?? claims.FindFirst("role")?.Value;
}