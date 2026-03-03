using Microsoft.AspNetCore.Mvc;
using StateleSSE.AspNetCore;

namespace Api.Controllers;

[ApiController]
public sealed class SseController(ISseBackplane backplane)
    : RealtimeControllerBase(backplane);

// Alternative explicit implementation (same behaviour):
//
// using System.Text.Json;
//
// [ApiController]
// [Route("sse")]
// public sealed class SseController(ISseBackplane backplane) : ControllerBase
// {
//     [HttpGet]
//     public async Task Connect()
//     {
//         await using var sse = await HttpContext.OpenSseStreamAsync();
//         await using var connection = backplane.CreateConnection();
//
//         await sse.WriteAsync("ConnectionResponse",
//             JsonSerializer.Serialize(new { eventType = "ConnectionResponse", connectionId = connection.ConnectionId }));
//
//         await foreach (var evt in connection.ReadAllAsync(HttpContext.RequestAborted))
//         {
//             if (evt.Group != null)
//                 await sse.WriteAsync(evt.Group, evt.Data);
//             else
//                 await sse.WriteAsync(evt.Data);
//         }
//     }
// }