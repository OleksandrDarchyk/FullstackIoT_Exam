using dataAccess;
using dataAccess.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public sealed class WindmillSeeder(
    WindmillDbContext db,
    AppOptions opts,
    PasswordHashService passwordHash,
    ILogger<WindmillSeeder> logger,
    IHostEnvironment env
)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (env.IsDevelopment())
        {
            logger.LogInformation("EF create script (debug):\n{Script}", db.Database.GenerateCreateScript());
        }

        await db.Database.MigrateAsync(ct);

        var farm = await db.Farms.FirstOrDefaultAsync(f => f.Id == opts.FarmId, ct);
        if (farm is null)
        {
            farm = new Farm
            {
                Id = opts.FarmId,
                Name = "Exam Farm",
                CreatedAt = DateTimeOffset.UtcNow
            };

            db.Farms.Add(farm);
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded farm: {FarmId}", opts.FarmId);
        }

        var turbines = new[]
        {
            new Turbine { FarmId = opts.FarmId, TurbineId = "turbine-alpha", Name = "Alpha", Location = "North Platform", CreatedAt = DateTimeOffset.UtcNow },
            new Turbine { FarmId = opts.FarmId, TurbineId = "turbine-beta",  Name = "Beta",  Location = "North Platform", CreatedAt = DateTimeOffset.UtcNow },
            new Turbine { FarmId = opts.FarmId, TurbineId = "turbine-gamma", Name = "Gamma", Location = "South Platform", CreatedAt = DateTimeOffset.UtcNow },
            new Turbine { FarmId = opts.FarmId, TurbineId = "turbine-delta", Name = "Delta", Location = "East Platform",  CreatedAt = DateTimeOffset.UtcNow },
        };

        foreach (var t in turbines)
        {
            var exists = await db.Turbines.AnyAsync(x =>
                x.FarmId == t.FarmId && x.TurbineId == t.TurbineId, ct);

            if (!exists) db.Turbines.Add(t);
        }

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded turbines for farm: {FarmId}", opts.FarmId);

        if (env.IsDevelopment())
        {
            const string username = "test";
            const string password = "pass1234";

            var userExists = await db.Users.AnyAsync(u => u.Username == username, ct);
            if (!userExists)
            {
                var (hash, salt) = passwordHash.Hash(password);

                db.Users.Add(new AppUser
                {
                    Id = Guid.NewGuid(),
                    Username = username,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    Role = "Operator",
                    CreatedAt = DateTimeOffset.UtcNow
                });

                await db.SaveChangesAsync(ct);

                logger.LogInformation("Seeded DEV user: username={Username}, password={Password}", username, password);
            }
        }
    }
}