using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using dataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Mqtt.Controllers;
using NSwag;
using NSwag.Generation.Processors.Security;
using StackExchange.Redis;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.Extensions;

namespace Api;

public class Program
{
    public static void ConfigureServices(IServiceCollection services)
    {
        // AppOptions
        services.AddSingleton<AppOptions>(sp =>
        {
            var configuration = sp.GetRequiredService<IConfiguration>();
            var opts = new AppOptions();
            configuration.GetSection(nameof(AppOptions)).Bind(opts);
            return opts;
        });

        // DB
        services.AddDbContext<WindmillDbContext>((sp, db) =>
        {
            var opts = sp.GetRequiredService<AppOptions>();
            db.UseNpgsql(opts.DbConnectionString);
        });

        // SSE shutdown
        services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromSeconds(0));

        // Redis
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var opts = sp.GetRequiredService<AppOptions>();
            var cfg = ConfigurationOptions.Parse(opts.RedisConnectionString);
            cfg.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(cfg);
        });

        services.AddRedisSseBackplane();

        // JWT
        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IServiceProvider>((options, sp) =>
            {
                var appOptions = sp.GetRequiredService<AppOptions>();
                var key = Encoding.UTF8.GetBytes(appOptions.JwtSecret);

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateLifetime = true
                };
            });

        services.AddAuthorization();

        // MQTT
        services.AddMqttControllers();

        // Controllers + JSON
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });

        // Swagger / OpenAPI (NSwag)
        services.AddOpenApiDocument(config =>
        {
            config.AddSecurity("Bearer", new OpenApiSecurityScheme
            {
                Type = OpenApiSecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Enter your JWT token"
            });
            config.OperationProcessors.Add(new AspNetCoreOperationSecurityScopeProcessor("Bearer"));
        });

        // CORS
        services.AddCors();

        // Errors
        services.AddProblemDetails();
        services.AddExceptionHandler<GlobalExceptionHandler>();
    }

    public static async Task Main()
    {
        var builder = WebApplication.CreateBuilder();
        ConfigureServices(builder.Services);

        var app = builder.Build();

        // Validate AppOptions
        var opts = app.Services.GetRequiredService<AppOptions>();
        Validator.ValidateObject(opts, new ValidationContext(opts), validateAllProperties: true);

        app.UseExceptionHandler();

        app.UseOpenApi();
        app.UseSwaggerUi();

        app.UseCors(c => c.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowAnyOrigin()
            .SetIsOriginAllowed(_ => true));

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        // MQTT connect on startup
        var mqttClient = app.Services.GetRequiredService<IMqttClientService>();
        await mqttClient.ConnectAsync(opts.MqttBroker, opts.MqttPort, "", "");
        // TS client (dev only)
        if (app.Environment.IsDevelopment())
        {
            app.GenerateApiClientsFromOpenApi(
                    "../../client/src/generated-ts-client.ts",
                    "./openapi.json")
                .GetAwaiter()
                .GetResult();
        }

        app.Run();
    }
}