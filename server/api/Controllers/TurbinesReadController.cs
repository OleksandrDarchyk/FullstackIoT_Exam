using Api.DTO;
using dataAccess;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[ApiController]
[Route("api/turbines")]
public sealed class TurbinesReadController(WindmillDbContext db, AppOptions opts) : ControllerBase
{
    [HttpGet]
    public Task<List<TurbineDto>> GetAll(CancellationToken ct)
        => db.Turbines.AsNoTracking()
            .Where(t => t.FarmId == opts.FarmId)
            .OrderBy(t => t.TurbineId)
            .Select(t => new TurbineDto(t.TurbineId, t.Name, t.Location))
            .ToListAsync(ct);
}