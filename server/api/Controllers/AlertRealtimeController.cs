using System.ComponentModel.DataAnnotations;
using dataAccess;
using dataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;

namespace Api.Controllers;

[ApiController]
[Authorize]
public sealed class AlertRealtimeController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    WindmillDbContext db,
    AppOptions opts
) : ControllerBase
{
    [HttpGet(nameof(GetAlerts))]
    public async Task<RealtimeListenResponse<List<Alert>>> GetAlerts(
        string connectionId,
        string? turbineId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            throw new ValidationException("connectionId is required");

        var hasTurbine = !string.IsNullOrWhiteSpace(turbineId);
        var group = hasTurbine ? $"alerts:{turbineId}" : "alerts";

        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<WindmillDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasAdded<Alert>(),
            query: async ctx =>
            {
                var q = ctx.Alerts.Where(x => x.FarmId == opts.FarmId);

                if (hasTurbine)
                    q = q.Where(x => x.TurbineId == turbineId);

                return await q
                    .OrderByDescending(x => x.Ts)
                    .Take(50)
                    .ToListAsync();
            }
        );

        IQueryable<Alert> initialQuery = db.Alerts.Where(x => x.FarmId == opts.FarmId);

        if (hasTurbine)
            initialQuery = initialQuery.Where(x => x.TurbineId == turbineId);

        var initial = await initialQuery
            .OrderByDescending(x => x.Ts)
            .Take(50)
            .ToListAsync(ct);

        return new RealtimeListenResponse<List<Alert>>(group, initial);
    }
}