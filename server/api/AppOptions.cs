using System.ComponentModel.DataAnnotations;

namespace Api;

public sealed class AppOptions
{
    [Required, MinLength(1)]
    public string DbConnectionString { get; set; } = "";

    [Required, MinLength(1)]
    public string RedisConnectionString { get; set; } = "";

    [Required, MinLength(1)]
    public string MqttBroker { get; set; } = "";

    [Range(1, 65535)]
    public int MqttPort { get; set; }

    [Required, MinLength(32)]
    public string JwtSecret { get; set; } = "";

    public string JwtIssuer { get; set; } = "";
    public string JwtAudience { get; set; } = "";

    [Required, MinLength(1)]
    [MaxLength(200)]
    public string FarmId { get; set; } = "";
}