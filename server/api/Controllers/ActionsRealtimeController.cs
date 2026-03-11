using System.ComponentModel.DataAnnotations;
using Api.DTO;
using dataAccess;
using dataAccess.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StateleSSE.AspNetCore;
using StateleSSE.AspNetCore.EfRealtime;

namespace Api.Controllers;

[ApiController]
public sealed class ActionsRealtimeController(
    ISseBackplane backplane,
    IRealtimeManager realtimeManager,
    WindmillDbContext db,
    AppOptions opts
) : ControllerBase
{
    [Authorize]
    [HttpGet(nameof(GetActions))]
    public async Task<RealtimeListenResponse<List<OperatorActionDto>>> GetActions(
        string connectionId,
        string turbineId,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
            throw new ValidationException("connectionId is required");

        if (string.IsNullOrWhiteSpace(turbineId))
            throw new ValidationException("turbineId is required");

        var group = $"actions:{turbineId}";

        await backplane.Groups.AddToGroupAsync(connectionId, group);

        realtimeManager.Subscribe<WindmillDbContext>(
            connectionId,
            group,
            criteria: snapshot => snapshot.HasChanges<OperatorAction>(),
            query: async ctx => new SseEvent<List<OperatorActionDto>>(
                "ActionsUpdate",
                await ctx.OperatorActions
                    .AsNoTracking()
                    .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
                    .OrderByDescending(x => x.RequestedAt)
                    .Take(50)
                    .Select(x => new OperatorActionDto(
                        x.Id, x.TurbineId, x.RequestedAt,
                        x.Action, x.PayloadJson, x.Status, x.ValidationError,
                        x.User.Username))
                    .ToListAsync())
        );

        var initial = await db.OperatorActions
            .AsNoTracking()
            .Where(x => x.FarmId == opts.FarmId && x.TurbineId == turbineId)
            .OrderByDescending(x => x.RequestedAt)
            .Take(50)
            .Select(x => new OperatorActionDto(
                x.Id, x.TurbineId, x.RequestedAt,
                x.Action, x.PayloadJson, x.Status, x.ValidationError,
                x.User.Username))
            .ToListAsync(ct);

        return new RealtimeListenResponse<List<OperatorActionDto>>(group, initial);
    }
}
