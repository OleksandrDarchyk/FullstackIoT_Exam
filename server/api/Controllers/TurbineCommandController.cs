using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
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
    [Authorize]
    [HttpPost("{turbineId}/command")]
    public async Task SendCommand(string turbineId, [FromBody] JsonElement command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        ValidateCommand(command);

        var userIdRaw = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? throw new UnauthorizedAccessException("Missing NameIdentifier claim");

        if (!Guid.TryParse(userIdRaw, out var userGuid))
            throw new ValidationException("UserId in token is not a GUID");

        // FK safety (Farm + 4 Turbines)
        await WindmillSeeder.EnsureFarmAndTurbinesAsync(db, opts.FarmId, ct);

        var turbineExists = await db.Turbines.AnyAsync(
            t => t.FarmId == opts.FarmId && t.TurbineId == turbineId, ct);

        if (!turbineExists)
            throw new ValidationException($"Unknown turbineId '{turbineId}' for farm '{opts.FarmId}'");

        var action = command.GetProperty("action").GetString() ?? "";

        var row = new OperatorAction
        {
            Id = Guid.NewGuid(),
            FarmId = opts.FarmId,
            TurbineId = turbineId,
            UserId = userGuid,
            Action = action,
            PayloadJson = command.GetRawText(),
            RequestedAt = DateTimeOffset.UtcNow,
            Status = "Requested"
        };

        db.OperatorActions.Add(row);
        await db.SaveChangesAsync(ct);

        var topic = $"farm/{opts.FarmId}/windmill/{turbineId}/command";

        try
        {
            await mqtt.PublishAsync(topic, command.GetRawText());
            row.Status = "Sent";
            await db.SaveChangesAsync(ct);

            logger.LogInformation("Command sent: turbine={TurbineId} action={Action}", turbineId, action);
        }
        catch (Exception ex)
        {
            row.Status = "Failed";
            row.ValidationError = ex.Message;
            await db.SaveChangesAsync(ct);

            logger.LogError(ex, "Failed to publish command: turbine={TurbineId} action={Action}", turbineId, action);
            throw;
        }
    }

    private static void ValidateCommand(JsonElement command)
    {
        if (command.ValueKind != JsonValueKind.Object)
            throw new ValidationException("Command must be a JSON object");

        if (!command.TryGetProperty("action", out var actionProp) || actionProp.ValueKind != JsonValueKind.String)
            throw new ValidationException("Command must contain string property 'action'");

        var action = actionProp.GetString();

        switch (action)
        {
            case "setInterval":
                if (!command.TryGetProperty("value", out var valueProp) || valueProp.ValueKind != JsonValueKind.Number)
                    throw new ValidationException("setInterval requires numeric 'value'");

                var value = valueProp.GetInt32();
                if (value is < 1 or > 60)
                    throw new ValidationException("setInterval value must be 1..60 seconds");
                break;

            case "setPitch":
                if (!command.TryGetProperty("angle", out var angleProp) || angleProp.ValueKind != JsonValueKind.Number)
                    throw new ValidationException("setPitch requires numeric 'angle'");

                var angle = angleProp.GetDouble();
                if (angle < 0 || angle > 30)
                    throw new ValidationException("setPitch angle must be 0..30 degrees");
                break;

            case "stop":
                if (command.TryGetProperty("reason", out var reasonProp) && reasonProp.ValueKind != JsonValueKind.String)
                    throw new ValidationException("stop 'reason' must be a string if provided");
                break;

            case "start":
                break;

            default:
                throw new ValidationException("Unknown action. Allowed: setInterval, stop, start, setPitch");
        }
    }
}