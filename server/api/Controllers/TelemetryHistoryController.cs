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
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        if (limit < 1 || limit > 2000)
            throw new ValidationException("limit must be 1..2000");

        var rows = await db.Telemetry.AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.Ts)
            .Take(limit)
            .ToListAsync(ct);

        rows.Reverse(); 

        return rows.Select(x => new TelemetryPointDto(
            x.TurbineId, x.Ts,
            x.WindSpeed, x.PowerOutput, x.RotorSpeed,
            x.GeneratorTemp, x.GearboxTemp, x.Vibration,
            x.BladePitch, x.Status
        )).ToList();
    }
}