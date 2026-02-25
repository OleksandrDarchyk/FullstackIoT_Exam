using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace dataAccess.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_user",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Username = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    PasswordSalt = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_user", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "farm",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_farm", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "turbine",
                columns: table => new
                {
                    FarmId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurbineId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Location = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_turbine", x => new { x.FarmId, x.TurbineId });
                    table.ForeignKey(
                        name: "FK_turbine_farm_FarmId",
                        column: x => x.FarmId,
                        principalTable: "farm",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "alert",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FarmId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurbineId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Ts = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Severity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert", x => x.Id);
                    table.ForeignKey(
                        name: "FK_alert_farm_FarmId",
                        column: x => x.FarmId,
                        principalTable: "farm",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alert_turbine_FarmId_TurbineId",
                        columns: x => new { x.FarmId, x.TurbineId },
                        principalTable: "turbine",
                        principalColumns: new[] { "FarmId", "TurbineId" });
                });

            migrationBuilder.CreateTable(
                name: "operator_action",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FarmId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurbineId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false),
                    RequestedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ValidationError = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_action", x => x.Id);
                    table.ForeignKey(
                        name: "FK_operator_action_app_user_UserId",
                        column: x => x.UserId,
                        principalTable: "app_user",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_operator_action_turbine_FarmId_TurbineId",
                        columns: x => new { x.FarmId, x.TurbineId },
                        principalTable: "turbine",
                        principalColumns: new[] { "FarmId", "TurbineId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "telemetry",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FarmId = table.Column<Guid>(type: "uuid", nullable: false),
                    TurbineId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Ts = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WindSpeed = table.Column<double>(type: "double precision", nullable: true),
                    WindDirection = table.Column<double>(type: "double precision", nullable: true),
                    AmbientTemperature = table.Column<double>(type: "double precision", nullable: true),
                    RotorSpeed = table.Column<double>(type: "double precision", nullable: true),
                    PowerOutput = table.Column<double>(type: "double precision", nullable: true),
                    NacelleDirection = table.Column<double>(type: "double precision", nullable: true),
                    BladePitch = table.Column<double>(type: "double precision", nullable: true),
                    GeneratorTemp = table.Column<double>(type: "double precision", nullable: true),
                    GearboxTemp = table.Column<double>(type: "double precision", nullable: true),
                    Vibration = table.Column<double>(type: "double precision", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    PayloadJson = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_telemetry", x => x.Id);
                    table.ForeignKey(
                        name: "FK_telemetry_turbine_FarmId_TurbineId",
                        columns: x => new { x.FarmId, x.TurbineId },
                        principalTable: "turbine",
                        principalColumns: new[] { "FarmId", "TurbineId" },
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alert_FarmId_Severity_Ts",
                table: "alert",
                columns: new[] { "FarmId", "Severity", "Ts" });

            migrationBuilder.CreateIndex(
                name: "IX_alert_FarmId_Ts",
                table: "alert",
                columns: new[] { "FarmId", "Ts" });

            migrationBuilder.CreateIndex(
                name: "IX_alert_FarmId_TurbineId_Ts",
                table: "alert",
                columns: new[] { "FarmId", "TurbineId", "Ts" });

            migrationBuilder.CreateIndex(
                name: "IX_app_user_Username",
                table: "app_user",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_operator_action_FarmId_TurbineId_RequestedAt",
                table: "operator_action",
                columns: new[] { "FarmId", "TurbineId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_operator_action_UserId_RequestedAt",
                table: "operator_action",
                columns: new[] { "UserId", "RequestedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_FarmId_Ts",
                table: "telemetry",
                columns: new[] { "FarmId", "Ts" });

            migrationBuilder.CreateIndex(
                name: "IX_telemetry_FarmId_TurbineId_Ts",
                table: "telemetry",
                columns: new[] { "FarmId", "TurbineId", "Ts" });

            migrationBuilder.CreateIndex(
                name: "IX_turbine_FarmId",
                table: "turbine",
                column: "FarmId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alert");

            migrationBuilder.DropTable(
                name: "operator_action");

            migrationBuilder.DropTable(
                name: "telemetry");

            migrationBuilder.DropTable(
                name: "app_user");

            migrationBuilder.DropTable(
                name: "turbine");

            migrationBuilder.DropTable(
                name: "farm");
        }
    }
}
