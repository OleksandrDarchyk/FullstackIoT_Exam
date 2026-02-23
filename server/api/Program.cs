using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Mqtt.Controllers;
using NSwag;
using NSwag.Generation.Processors.Security;
using StateleSSE.AspNetCore;

// Optional (uncomment  add these packages)
// using StateleSSE.AspNetCore.EfRealtime;
// using StateleSSE.AspNetCore.GroupRealtime;
// using StateleSSE.AspNetCore.Extensions; // AddEfRealtimeInterceptor
// using Testcontainers.PostgreSql;
// using StackExchange.Redis;

namespace Api;

public class Program
{
    public static void ConfigureServices(IServiceCollection services, IConfiguration configuration)
    {
        // --- App options / configuration ---
        var appOptions = new AppOptions();
        configuration.GetSection(nameof(AppOptions)).Bind(appOptions);

        // Optional: validate options at startup
        // Validator.ValidateObject(appOptions, new ValidationContext(appOptions), validateAllProperties: true);

        services.AddSingleton(appOptions);

        // --- Database (EF + Postgres) ---
        // IMPORTANT:
        // DbContext is expected to live in the dataAccess project.
        // Uncomment this block after  create  DbContext and fix the type name/namespace.
        //
        // services.AddDbContext<dataAccess.MyDbContext>((sp, db) =>
        // {
        //     var opts = sp.GetRequiredService<AppOptions>();
        //     db.UseNpgsql(opts.DbConnectionString);
        //
        //     // Live Queries trigger on SaveChanges()
        //     // Uncomment when  add StateleSSE.AspNetCore.EfRealtime + Extensions:
        //     // db.AddEfRealtimeInterceptor(sp);
        // });

        // Optional: start Postgres via Testcontainers when connection string is missing
        // (Uncomment when you  Testcontainers.PostgreSql)
        //
        // if (string.IsNullOrWhiteSpace(appOptions.DbConnectionString))
        // {
        //     var container = new PostgreSqlBuilder("postgres:15.1").Build();
        //     container.StartAsync().GetAwaiter().GetResult();
        //     appOptions.DbConnectionString = container.GetConnectionString();
        // }

        // --- Graceful shutdown for SSE ---
        services.Configure<HostOptions>(opts => opts.ShutdownTimeout = TimeSpan.FromSeconds(0));

        // --- StateleSSE backplane ---
        services.AddInMemorySseBackplane();

        // Optional: Redis backplane (scaling / production)
        //
        // services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
        // {
        //     var opts = sp.GetRequiredService<AppOptions>();
        //     var config = StackExchange.Redis.ConfigurationOptions.Parse(opts.RedisConnectionString);
        //     config.AbortOnConnectFail = false;
        //     return StackExchange.Redis.ConnectionMultiplexer.Connect(config);
        // });
        // services.AddRedisSseBackplane();

        // --- Live Queries / Group realtime ---
        // Uncomment when you :
        // - StateleSSE.AspNetCore.EfRealtime
        // - StateleSSE.AspNetCore.GroupRealtime
        //
        // services.AddEfRealtime();
        // services.AddGroupRealtime();

        // --- Authentication / Authorization (JWT) ---
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(appOptions.JwtSecret))
            });

        services.AddAuthorization();

        // Optional: stricter JWT validation
        //
        // services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
        //     .Configure<IServiceProvider>((options, sp) =>
        //     {
        //         var opts = sp.GetRequiredService<AppOptions>();
        //         var key = Encoding.UTF8.GetBytes(opts.JwtSecret);
        //
        //         options.TokenValidationParameters = new TokenValidationParameters
        //         {
        //             ValidateIssuer = true,
        //             ValidIssuer = opts.JwtIssuer,
        //             ValidateAudience = true,
        //             ValidAudience = opts.JwtAudience,
        //             ValidateIssuerSigningKey = true,
        //             IssuerSigningKey = new SymmetricSecurityKey(key),
        //             ValidateLifetime = true
        //         };
        //     });

        // --- MQTT controllers ---
        services.AddMqttControllers();

        // --- Controllers + JSON settings ---
        services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });

        // --- Swagger / OpenAPI (NSwag) ---
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

        // --- CORS ---
        services.AddCors();

        // --- ProblemDetails / Exception handler ---
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                var exception = context.HttpContext.Features.Get<IExceptionHandlerFeature>()?.Error;
                if (exception != null)
                {
                    context.ProblemDetails.Detail = exception.Message;
                }
            };
        });

        //  custom exception handler
         services.AddExceptionHandler<GlobalExceptionHandler>();

        // Optional: seed data
        // services.AddScoped<Seeder>();

        // Optional: token issuing service (login/register)
        // services.AddSingleton<JwtService>();
    }

    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        ConfigureServices(builder.Services, builder.Configuration);

        var app = builder.Build();

        app.UseExceptionHandler();
        app.UseOpenApi();
        app.UseSwaggerUi();

        app.UseCors(c =>
            c.AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .SetIsOriginAllowed(_ => true));

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapControllers();

        // Optional: serve static files (e.g., built React)
        app.UseStaticFiles();

        // --- MQTT connect on startup ---
        var opts = app.Services.GetRequiredService<AppOptions>();
        var mqttClient = app.Services.GetRequiredService<IMqttClientService>();
        await mqttClient.ConnectAsync(opts.MqttBroker, opts.MqttPort, "", "");

        // Generate TypeScript client from OpenAPI 
        app.GenerateApiClientsFromOpenApi("../client/src/generated-ts-client.ts", "./openapi.json").GetAwaiter().GetResult();
        
        // --- Seed data ---
        // using (var scope = app.Services.CreateScope())
        // {
        //     scope.ServiceProvider.GetRequiredService<Seeder>().Seed();
        // }

        await app.RunAsync();
    }
}

