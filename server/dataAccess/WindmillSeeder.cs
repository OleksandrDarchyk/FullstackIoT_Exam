using dataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace dataAccess;

public static class WindmillSeeder
{
    public static async Task EnsureFarmAndTurbinesAsync(
        WindmillDbContext db,
        string farmId,
        CancellationToken ct = default)
    {
        var farmExists = await db.Farms.AnyAsync(f => f.Id == farmId, ct);
        if (!farmExists)
        {
            db.Farms.Add(new Farm { Id = farmId, Name = "Exam Farm" });
        }

        var turbines = new[]
        {
            new Turbine { FarmId = farmId, TurbineId = "turbine-alpha", Name = "Alpha", Location = "North Platform" },
            new Turbine { FarmId = farmId, TurbineId = "turbine-beta",  Name = "Beta",  Location = "North Platform" },
            new Turbine { FarmId = farmId, TurbineId = "turbine-gamma", Name = "Gamma", Location = "South Platform" },
            new Turbine { FarmId = farmId, TurbineId = "turbine-delta", Name = "Delta", Location = "East Platform" },
        };

        foreach (var t in turbines)
        {
            var exists = await db.Turbines.AnyAsync(x =>
                x.FarmId == t.FarmId && x.TurbineId == t.TurbineId, ct);

            if (!exists) db.Turbines.Add(t);
        }

        await db.SaveChangesAsync(ct);
    }
}