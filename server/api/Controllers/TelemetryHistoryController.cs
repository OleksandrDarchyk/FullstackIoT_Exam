using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/turbines/{turbineId}/telemetry")]
public sealed class TelemetryHistoryController(WindmillDbContext db, AppOptions opts) : ControllerBase
{
    [HttpGet]
    public async Task<List<TelemetryPointDto>> GetHistory(
        string turbineId,
        [FromQuery] int limit = 200,
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        if (limit < 1 || limit > 2000)
            throw new ValidationException("limit must be 1..2000");

        if (from.HasValue && to.HasValue && from.Value > to.Value)
            throw new ValidationException("'from' must be <= 'to'");

        var q = db.Telemetry.AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId);

        if (from.HasValue)
            q = q.Where(x => x.Ts >= from.Value);

        if (to.HasValue)
            q = q.Where(x => x.Ts <= to.Value);

        var rows = await q
            .OrderByDescending(x => x.Ts)
            .Take(limit)
            .ToListAsync(ct);

        rows.Reverse();

        return rows.Select(x => new TelemetryPointDto(
            x.TurbineId, x.Ts,
            x.WindSpeed, x.WindDirection, x.AmbientTemperature,
            x.PowerOutput, x.RotorSpeed, x.NacelleDirection,
            x.GeneratorTemp, x.GearboxTemp, x.Vibration,
            x.BladePitch, x.Status
        )).ToList();
    }
}