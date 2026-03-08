using Microsoft.AspNetCore.Mvc;
using StateleSSE.AspNetCore;

namespace Api.Controllers;

[ApiController]
public sealed class SseController(ISseBackplane backplane)
    : RealtimeControllerBase(backplane);