using dataAccess;
using dataAccess.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;

namespace Api.Controllers;

[ApiController]
public sealed class TelemetryRealtimeController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    WindmillDbContext db,
    AppOptions opts
) : RealtimeControllerBase(backplane)
{
    // GET /GetTelemetry?connectionId=...&turbineId=turbine-alpha
    [HttpGet(nameof(GetTelemetry))]
    public async Task<RealtimeListenResponse<List<TelemetryRecord>>> GetTelemetry(
        string connectionId,
        string turbineId,
        CancellationToken ct)
    {
        var group = $"telemetry:{turbineId}";

        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<WindmillDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasAdded<TelemetryRecord>(),
            query: async ctx => await ctx.Telemetry
                .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
                .OrderByDescending(x => x.Ts)
                .Take(50)
                .ToListAsync()
        );

        var initial = await db.Telemetry
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.Ts)
            .Take(50)
            .ToListAsync(ct);

        return new RealtimeListenResponse<List<TelemetryRecord>>(group, initial);
    }
}