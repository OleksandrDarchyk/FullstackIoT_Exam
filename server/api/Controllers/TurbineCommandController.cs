using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using Api.DTO;
using dataAccess;
using dataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;

namespace Api.Controllers;

[ApiController]
[Route("api/turbines")]
public sealed class TurbineCommandController(
    IMqttClientService mqtt,
    WindmillDbContext db,
    AppOptions opts,
    ILogger<TurbineCommandController> logger
) : ControllerBase
{
    private static readonly JsonSerializerOptions _camelCase =
        new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    [Authorize]
    [HttpPost("{turbineId}/command")]
    public async Task SendCommand(string turbineId, [FromBody] CommandRequestDto command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        ValidateCommand(command);

        var userIdRaw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? throw new UnauthorizedAccessException("Missing NameIdentifier claim");

        if (!Guid.TryParse(userIdRaw, out var userGuid))
            throw new ValidationException("UserId in token is not a GUID");

        var turbineExists = await db.Turbines.AnyAsync(
            t => t.FarmId == opts.FarmId && t.TurbineId == turbineId, ct);

        if (!turbineExists)
            throw new ValidationException(
                $"Unknown turbineId '{turbineId}' for farm '{opts.FarmId}'. Did you run seed on startup?");

        var payloadJson = JsonSerializer.Serialize(command, _camelCase);

        var row = new OperatorAction
        {
            Id = Guid.NewGuid(),
            FarmId = opts.FarmId,
            TurbineId = turbineId,
            UserId = userGuid,
            Action = command.Action,
            PayloadJson = payloadJson,
            RequestedAt = DateTimeOffset.UtcNow,
            Status = "Requested"
        };

        db.OperatorActions.Add(row);
        await db.SaveChangesAsync(ct);

        var topic = $"farm/{opts.FarmId}/windmill/{turbineId}/command";

        try
        {
            await mqtt.PublishAsync(topic, payloadJson);

            row.Status = "Sent";
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Command sent: turbine={TurbineId} action={Action}", turbineId, command.Action);
        }
        catch (Exception ex)
        {
            row.Status = "Failed";
            row.ValidationError = ex.Message;
            await db.SaveChangesAsync(ct);

            logger.LogError(ex, "Failed to publish command: turbine={TurbineId} action={Action}", turbineId, command.Action);
            throw;
        }
    }

    private static void ValidateCommand(CommandRequestDto command)
    {
        switch (command.Action)
        {
            case "setInterval":
            {
                if (command.Value is null)
                    throw new ValidationException("setInterval requires 'value'");
                if (command.Value < 1 || command.Value > 60)
                    throw new ValidationException("setInterval value must be 1..60 seconds");
                break;
            }

            case "setPitch":
            {
                if (command.Angle is null)
                    throw new ValidationException("setPitch requires 'angle'");
                if (command.Angle < 0 || command.Angle > 30)
                    throw new ValidationException("setPitch angle must be 0..30 degrees");
                break;
            }

            case "stop":
                break;

            case "start":
                break;

            default:
                throw new ValidationException("Unknown action. Allowed: setInterval, stop, start, setPitch");
        }
    }
}
