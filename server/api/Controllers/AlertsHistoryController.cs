using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/turbines/{turbineId}/alerts")]
public sealed class AlertsHistoryController(WindmillDbContext db, AppOptions opts) : ControllerBase
{
    [HttpGet]
    public Task<List<AlertDto>> GetAlerts(
        [FromRoute] string turbineId,
        [FromQuery] int limit = 50,
        [FromQuery] DateTimeOffset? from = null,
        [FromQuery] DateTimeOffset? to = null,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        if (limit < 1 || limit > 500)
            throw new ValidationException("limit must be 1..500");

        if (from.HasValue && to.HasValue && from.Value > to.Value)
            throw new ValidationException("'from' must be <= 'to'");

        var q = db.Alerts.AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId);

        if (from.HasValue)
            q = q.Where(x => x.Ts >= from.Value);

        if (to.HasValue)
            q = q.Where(x => x.Ts <= to.Value);

        return q
            .OrderByDescending(x => x.Ts)
            .Take(limit)
            .Select(x => new AlertDto(x.Id, x.TurbineId, x.Ts, x.Severity, x.Message))
            .ToListAsync(ct);
    }
}