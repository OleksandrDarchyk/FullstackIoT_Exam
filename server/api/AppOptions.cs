using System.ComponentModel.DataAnnotations;

namespace Api;

public sealed class AppOptions
{
    // DB
    public string DbConnectionString { get; set; } = "";

    // MQTT
    public string MqttBroker { get; set; } = "broker.hivemq.com";
    public int MqttPort { get; set; } = 1883;

    // JWT
    [MinLength(16)]
    public string JwtSecret { get; set; } = "dev-secret-change-me-please";

    // Optional stricter JWT settings
    public string JwtIssuer { get; set; } = "";
    public string JwtAudience { get; set; } = "";

    // Redis 
    public string RedisConnectionString { get; set; } = "";
}