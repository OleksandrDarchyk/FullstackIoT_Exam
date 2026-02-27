using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Authorize]
[Route("api/turbines/{turbineId}/actions")]
public sealed class ActionsHistoryController(WindmillDbContext db, AppOptions opts) : ControllerBase
{
    [HttpGet]
    public Task<List<OperatorActionDto>> GetActions(string turbineId, [FromQuery] int limit = 50, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        if (limit < 1 || limit > 500)
            throw new ValidationException("limit must be 1..500");

        return db.OperatorActions.AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.RequestedAt)
            .Take(limit)
            .Select(x => new OperatorActionDto(x.Id, x.TurbineId, x.RequestedAt, x.Action, x.Status, x.ValidationError))
            .ToListAsync(ct);
    }
}