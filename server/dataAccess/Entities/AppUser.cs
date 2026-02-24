using System.ComponentModel.DataAnnotations;

namespace dataAccess.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; }

    [MaxLength(200)]
    public string Username { get; set; } = "";

    public string PasswordHash { get; set; } = "";
    public string PasswordSalt { get; set; } = "";

    [MaxLength(20)]
    public string Role { get; set; } = "Operator";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; set; }

    public ICollection<OperatorAction> OperatorActions { get; set; } = new List<OperatorAction>();
}