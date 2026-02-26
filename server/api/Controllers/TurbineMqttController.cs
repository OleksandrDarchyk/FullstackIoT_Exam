using Api.DTO;
using dataAccess;
using dataAccess.Entities;
using Microsoft.EntityFrameworkCore;
using Mqtt.Controllers;

namespace Api.Controllers;

public sealed class TurbineMqttController(
    ILogger<TurbineMqttController> logger,
    AppOptions opts,
    WindmillDbContext db
) : MqttController
{
    [MqttRoute("farm/{farmId}/windmill/{turbineId}/telemetry")]
    public async Task HandleTelemetry(
        string topic,
        string payload,
        string farmId,
        string turbineId,
        TurbineTelemetryDto? data,
        CancellationToken ct)
    {
        // Only accept our farm
        if (!string.Equals(farmId, opts.FarmId, StringComparison.OrdinalIgnoreCase))
            return;

        if (data is null)
        {
            logger.LogWarning("TELEMETRY deserialize failed. topic={Topic} payload={Payload}", topic, payload);
            return;
        }

        // If turbines are seeded on startup, this should always be true.
        // Keep the check to fail fast with a useful log instead of FK exception noise.
        var turbineExists = await db.Turbines.AnyAsync(
            t => t.FarmId == opts.FarmId && t.TurbineId == turbineId, ct);

        if (!turbineExists)
        {
            logger.LogWarning("Unknown turbineId '{TurbineId}' for farm '{FarmId}'. Did you run seed on startup?",
                turbineId, opts.FarmId);
            return;
        }

        db.Telemetry.Add(new TelemetryRecord
        {
            FarmId = opts.FarmId,
            TurbineId = turbineId,
            Ts = data.Timestamp,

            WindSpeed = data.WindSpeed,
            WindDirection = data.WindDirection,
            AmbientTemperature = data.AmbientTemperature,
            RotorSpeed = data.RotorSpeed,
            PowerOutput = data.PowerOutput,
            NacelleDirection = data.NacelleDirection,
            BladePitch = data.BladePitch,
            GeneratorTemp = data.GeneratorTemp,
            GearboxTemp = data.GearboxTemp,
            Vibration = data.Vibration,
            Status = data.Status,

            PayloadJson = payload
        });

        await db.SaveChangesAsync(ct);

        logger.LogInformation("Saved TELEMETRY: turbine={TurbineId} ts={Ts}", turbineId, data.Timestamp);
    }

    [MqttRoute("farm/{farmId}/windmill/{turbineId}/alert")]
    public async Task HandleAlert(
        string topic,
        string payload,
        string farmId,
        string turbineId,
        TurbineAlertDto? data,
        CancellationToken ct)
    {
        // Only accept our farm
        if (!string.Equals(farmId, opts.FarmId, StringComparison.OrdinalIgnoreCase))
            return;

        if (data is null)
        {
            logger.LogWarning("ALERT deserialize failed. topic={Topic} payload={Payload}", topic, payload);
            return;
        }

        var turbineExists = await db.Turbines.AnyAsync(
            t => t.FarmId == opts.FarmId && t.TurbineId == turbineId, ct);

        if (!turbineExists)
        {
            logger.LogWarning("Unknown turbineId '{TurbineId}' for farm '{FarmId}'. Did you run seed on startup?",
                turbineId, opts.FarmId);
            return;
        }

        db.Alerts.Add(new Alert
        {
            FarmId = opts.FarmId,
            TurbineId = turbineId,
            Ts = data.Timestamp,
            Severity = data.Severity,
            Message = data.Message,
            PayloadJson = payload
        });

        await db.SaveChangesAsync(ct);

        logger.LogWarning("Saved ALERT: turbine={TurbineId} severity={Severity}", turbineId, data.Severity);
    }
}