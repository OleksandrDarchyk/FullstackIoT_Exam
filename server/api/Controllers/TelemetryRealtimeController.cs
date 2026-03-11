using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using dataAccess.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;

namespace Api.Controllers;

[ApiController]
[Route("")]
public sealed class TelemetryRealtimeController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    WindmillDbContext db,
    AppOptions opts
) : ControllerBase
{
    [HttpGet(nameof(GetTelemetry))]
    public async Task<RealtimeListenResponse<List<TelemetryPointDto>>> GetTelemetry(
        string connectionId,
        string turbineId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            throw new ValidationException("connectionId is required");

        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        var group = $"telemetry:{turbineId}";

        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<WindmillDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasAdded<TelemetryRecord>(),
            query: async ctx => new SseEvent<List<TelemetryPointDto>>(
                "TelemetryUpdate",
                await ctx.Telemetry
                    .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
                    .OrderByDescending(x => x.Ts)
                    .Take(50)
                    .Select(x => new TelemetryPointDto(
                        x.TurbineId, x.Ts,
                        x.WindSpeed, x.WindDirection, x.AmbientTemperature,
                        x.PowerOutput, x.RotorSpeed, x.NacelleDirection,
                        x.GeneratorTemp, x.GearboxTemp, x.Vibration,
                        x.BladePitch, x.Status))
                    .ToListAsync())
        );

        var initial = await db.Telemetry
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.Ts)
            .Take(50)
            .Select(x => new TelemetryPointDto(
                x.TurbineId, x.Ts,
                x.WindSpeed, x.WindDirection, x.AmbientTemperature,
                x.PowerOutput, x.RotorSpeed, x.NacelleDirection,
                x.GeneratorTemp, x.GearboxTemp, x.Vibration,
                x.BladePitch, x.Status))
            .ToListAsync(ct);

        return new RealtimeListenResponse<List<TelemetryPointDto>>(group, initial);
    }
}
