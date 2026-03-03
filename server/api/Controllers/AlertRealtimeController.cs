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
public sealed class AlertRealtimeController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    WindmillDbContext db,
    AppOptions opts
) : ControllerBase
{
    [HttpGet(nameof(GetAlerts))]
    public async Task<RealtimeListenResponse<List<AlertDto>>> GetAlerts(
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
                IQueryable<Alert> q = ctx.Alerts.Where(x => x.FarmId == opts.FarmId);

                if (hasTurbine)
                    q = q.Where(x => x.TurbineId == turbineId);

                var data = await q
                    .OrderByDescending(x => x.Ts)
                    .Take(50)
                    .Select(x => new AlertDto(x.Id, x.TurbineId, x.Ts, x.Severity, x.Message))
                    .ToListAsync();

                return new SseEvent<List<AlertDto>>("AlertsUpdate", data);
            }
        );

        IQueryable<Alert> initialQuery = db.Alerts.Where(x => x.FarmId == opts.FarmId);

        if (hasTurbine)
            initialQuery = initialQuery.Where(x => x.TurbineId == turbineId);

        var initial = await initialQuery
            .OrderByDescending(x => x.Ts)
            .Take(50)
            .Select(x => new AlertDto(x.Id, x.TurbineId, x.Ts, x.Severity, x.Message))
            .ToListAsync(ct);

        return new RealtimeListenResponse<List<AlertDto>>(group, initial);
    }
}