using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api;
using Api.Services;
using FluentAssertions;
using Microsoft.IdentityModel.Tokens;

namespace tests;

public class JwtServiceTests
{
    private static JwtService CreateService(string secret = "super-secret-key-that-is-long-enough-32chars")
    {
        var opts = new AppOptions { JwtSecret = secret };
        return new JwtService(opts);
    }

    [Fact]
    public void GenerateToken_ReturnsNonEmptyString()
    {
        var service = CreateService();

        var token = service.GenerateToken(Guid.NewGuid(), "Operator");

        token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void GenerateToken_ReturnsValidJwtFormat()
    {
        var service = CreateService();

        var token = service.GenerateToken(Guid.NewGuid(), "Operator");

        var handler = new JwtSecurityTokenHandler();
        handler.CanReadToken(token).Should().BeTrue();
    }

    [Fact]
    public void GenerateToken_ContainsCorrectUserId()
    {
        var service = CreateService();
        var userId = Guid.NewGuid();

        var token = service.GenerateToken(userId, "Operator");

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);
        parsed.Claims
            .FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)!
            .Value
            .Should().Be(userId.ToString());
    }

    [Fact]
    public void GenerateToken_ContainsCorrectRole()
    {
        var service = CreateService();

        var token = service.GenerateToken(Guid.NewGuid(), "Admin");

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);
        parsed.Claims
            .FirstOrDefault(c => c.Type == ClaimTypes.Role)!
            .Value
            .Should().Be("Admin");
    }

    [Fact]
    public void GenerateToken_ValidatesWithCorrectSecret()
    {
        const string secret = "super-secret-key-that-is-long-enough-32chars";
        var service = CreateService(secret);

        var token = service.GenerateToken(Guid.NewGuid(), "Operator");

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
        };
        var act = () => new JwtSecurityTokenHandler().ValidateToken(token, validationParams, out _);

        act.Should().NotThrow();
    }

    [Fact]
    public void GenerateToken_FailsValidationWithWrongSecret()
    {
        var service = CreateService("super-secret-key-that-is-long-enough-32chars");

        var token = service.GenerateToken(Guid.NewGuid(), "Operator");

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("wrong-secret-key-that-is-long-enough-32chars")),
            ValidateIssuer = false,
            ValidateAudience = false,
        };
        var act = () => new JwtSecurityTokenHandler().ValidateToken(token, validationParams, out _);

        act.Should().Throw<SecurityTokenException>();
    }

    [Fact]
    public void GenerateToken_ExpiresInApproximately24Hours()
    {
        var service = CreateService();
        var before = DateTime.UtcNow;

        var token = service.GenerateToken(Guid.NewGuid(), "Operator");

        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);
        var ttl = parsed.ValidTo - before;
        ttl.Should().BeGreaterThan(TimeSpan.FromHours(23).Add(TimeSpan.FromMinutes(59)));
        ttl.Should().BeLessThan(TimeSpan.FromHours(24).Add(TimeSpan.FromMinutes(1)));
    }

}
