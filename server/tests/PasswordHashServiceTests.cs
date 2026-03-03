using System.Security.Cryptography;
using Api.Services;
using FluentAssertions;

namespace tests;

public class PasswordHashServiceTests
{
    [Fact]
    public void Hash_ReturnsNonEmptyHashAndSalt()
    {
        var service = new PasswordHashService();

        var (hash, salt) = service.Hash("my-password");

        hash.Should().NotBeNullOrEmpty();
        salt.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public void Hash_SamePassword_ReturnsDifferentSaltsEachTime()
    {
        var service = new PasswordHashService();

        var (_, salt1) = service.Hash("same-password");
        var (_, salt2) = service.Hash("same-password");

        salt1.Should().NotBe(salt2);
    }

    [Fact]
    public void Verify_CorrectPassword_ReturnsTrue()
    {
        var service = new PasswordHashService();
        var (hash, salt) = service.Hash("correct-password");

        var result = service.Verify("correct-password", salt, hash);

        result.Should().BeTrue();
    }

    [Fact]
    public void Verify_WrongPassword_ReturnsFalse()
    {
        var service = new PasswordHashService();
        var (hash, salt) = service.Hash("correct-password");

        var result = service.Verify("wrong-password", salt, hash);

        result.Should().BeFalse();
    }

    [Fact]
    public void Verify_TamperedHash_ReturnsFalse()
    {
        var service = new PasswordHashService();
        var (_, salt) = service.Hash("password");
        var (tamperedHash, _) = service.Hash("different-password");

        var result = service.Verify("password", salt, tamperedHash);

        result.Should().BeFalse();
    }

    [Fact]
    public void Verify_EmptyPassword_CorrectHashReturnsTrue()
    {
        var service = new PasswordHashService();
        var (hash, salt) = service.Hash("");

        var result = service.Verify("", salt, hash);

        result.Should().BeTrue();
    }

    [Fact]
    public void Verify_InvalidBase64Salt_ThrowsFormatException()
    {
        // Convert.FromBase64String кидає FormatException на некоректний Base64.
        // Це очікувана поведінка — глобальний exception handler поверне ProblemDetails.
        var service = new PasswordHashService();
        var (hash, _) = service.Hash("password");

        var act = () => service.Verify("password", saltBase64: "not-valid-base64!!!", hash);

        act.Should().Throw<FormatException>();
    }
}
