using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Api;
using Api.DTO;
using dataAccess;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Mqtt.Controllers;
using StackExchange.Redis;
using StateleSSE.AspNetCore;

namespace tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Unique DB name per factory instance — prevents data leaking between test classes
    private readonly string _dbName = $"ApiIntegrationTests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        // Provide valid AppOptions so Validator.ValidateObject in Main() passes
        builder.ConfigureAppConfiguration((_, config) =>
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AppOptions:DbConnectionString"] = "test",
                ["AppOptions:RedisConnectionString"] = "test",
                ["AppOptions:MqttBroker"] = "localhost",
                ["AppOptions:MqttPort"] = "1883",
                ["AppOptions:JwtSecret"] = "test-jwt-secret-key-long-enough-for-hmac-256",
                ["AppOptions:FarmId"] = "test-farm",
            }));

        builder.ConfigureTestServices(services =>
        {
            // ── DB: swap Npgsql for InMemory ─────────────────────────────────────────
            // Remove BOTH DbContextOptions AND IDbContextOptionsConfiguration —
            // EF Core 7+ registers the configure-action as IDbContextOptionsConfiguration<T>,
            // and if both Npgsql and InMemory configs remain it throws "two providers" error.
            foreach (var d in services.Where(d => d.ServiceType == typeof(DbContextOptions<WindmillDbContext>)).ToList())
                services.Remove(d);
            foreach (var d in services.Where(d => d.ServiceType == typeof(IDbContextOptionsConfiguration<WindmillDbContext>)).ToList())
                services.Remove(d);
            services.AddDbContext<WindmillDbContext>(opts => opts.UseInMemoryDatabase(_dbName));

            // ── SSE backplane: remove Redis (and its IConnectionMultiplexer dependency),
            //    replace with InMemory so no Redis connection is attempted at startup ──
            var backplaneDescriptors = services
                .Where(d =>
                    d.ServiceType.FullName?.Contains("ISseBackplane") == true ||
                    d.ImplementationType?.FullName?.Contains("RedisBackplane") == true ||
                    d.ServiceType == typeof(IConnectionMultiplexer))
                .ToList();
            foreach (var d in backplaneDescriptors) services.Remove(d);
            services.AddInMemorySseBackplane();

            // ── MQTT: replace with no-op so ConnectAsync in Main() doesn't fail ──────
            var mqttDescriptors = services
                .Where(d => d.ServiceType == typeof(IMqttClientService))
                .ToList();
            foreach (var d in mqttDescriptors) services.Remove(d);
            services.AddSingleton<IMqttClientService, FakeMqttClientService>();
        });
    }
}

public sealed class FakeMqttClientService : IMqttClientService
{
    public bool IsConnected => false;
    public Task ConnectAsync(string host, int port, string username, string password, bool? useTls = null) => Task.CompletedTask;
    public Task PublishAsync(string topic, string payload) => Task.CompletedTask;
    public Task SubscribeAsync(string topic) => Task.CompletedTask;
    public void RegisterHandler(string topicPattern, Func<string, string, Task> handler) { }
}

public class ApiSmokeTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions _json = new() { PropertyNameCaseInsensitive = true };

    private readonly HttpClient _client;

    public ApiSmokeTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetTurbines_Returns200AndFourSeededTurbines()
    {
        var response = await _client.GetAsync("/api/turbines");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var turbines = JsonSerializer.Deserialize<List<TurbineDto>>(
            await response.Content.ReadAsStringAsync(), _json);

        turbines.Should().HaveCount(4);
        turbines!.Select(t => t.TurbineId).Should().BeEquivalentTo(
            ["turbine-alpha", "turbine-beta", "turbine-gamma", "turbine-delta"]);
    }

    [Fact]
    public async Task PostCommand_WithoutToken_Returns401()
    {
        var response = await _client.PostAsync(
            "/api/turbines/turbine-alpha/command",
            JsonContent.Create(new { action = "stop" }));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task PostCommand_WithValidToken_IsNotRejectedByAuth()
    {
        // Seeder skips users in Test env — register one via the API
        var registerResponse = await _client.PostAsync(
            "/api/auth/register",
            JsonContent.Create(new RegisterRequestDto("smoke-user", "smoke1234")));
        registerResponse.EnsureSuccessStatusCode();

        var auth = JsonSerializer.Deserialize<AuthResponseDto>(
            await registerResponse.Content.ReadAsStringAsync(), _json)!;

        // Send a command with the issued JWT
        var request = new HttpRequestMessage(HttpMethod.Post, "/api/turbines/turbine-alpha/command")
        {
            Content = JsonContent.Create(new CommandRequestDto("stop", null, null, null)),
        };
        request.Headers.Add("Authorization", $"Bearer {auth.Token}");

        var response = await _client.SendAsync(request);

        // Auth passed → any status except 401 is acceptable
        // (200 when "stop" publishes via FakeMqttClientService; never 401)
        response.StatusCode.Should().NotBe(HttpStatusCode.Unauthorized);
    }
}
