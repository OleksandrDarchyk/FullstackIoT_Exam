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
    public Task<List<AlertDto>> GetAlerts(string turbineId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        if (limit < 1 || limit > 500)
            throw new ValidationException("limit must be 1..500");

        return db.Alerts.AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.Ts)
            .Take(limit)
            .Select(x => new AlertDto(x.Id, x.TurbineId, x.Ts, x.Severity, x.Message))
            .ToListAsync(ct);
    }
}