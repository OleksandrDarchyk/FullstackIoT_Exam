# FS+IoT — Wind Turbine Control Centre

FS+IoT is a full-stack IoT monitoring and control system for wind turbines. It provides an operator dashboard to monitor real-time sensor data, send control commands, and review the history of telemetry, alerts, and operator actions stored by the system.

| Service | URL |
|---|---|
| Frontend (React) | https://client-windfarm.fly.dev |
| Backend (.NET API) | https://server-windfarm-hill-1973.fly.dev |

---

## Login

**Operator (development seed user)**

| Username | Password |
|---|---|
| `test` | `pass1234` |

> The test user is seeded automatically on first run in development mode. Alternatively, you can register a new operator account via the UI.

---

## Features

### Guest (not logged in)

- View all turbines and live telemetry charts
- View live and historical alerts

### Operator Dashboard

- View all turbines for the farm
- Monitor live telemetry (wind speed, power output, rotor speed, temperature, etc.) with real-time charts
- Receive live alerts when sensor thresholds are exceeded
- Send control commands to individual turbines
- Review the history of telemetry, alerts, and operator actions stored by the system

### Commands

| Action | Payload |
|---|---|
| Start turbine | `{ "action": "start" }` |
| Stop turbine | `{ "action": "stop" }` |
| Set blade pitch (0–30°) | `{ "action": "setPitch", "angle": 15.5 }` |
| Set reporting interval (1–60 s) | `{ "action": "setInterval", "value": 10 }` |

Command actions are persisted with timestamps and operator identity;

---

## Core Business Rules

- A farm has multiple turbines; each turbine streams telemetry independently
- Telemetry and alerts arrive via MQTT and are persisted to the database
- Real-time updates are pushed to the browser via SSE (Server-Sent Events)
- The server only processes MQTT messages matching its own `FarmId`
- Commands are published back to MQTT and logged as `OperatorAction` records
- You cannot start an already running turbine or stop an already stopped one

---

## Technology Stack

| Area | Tech |
|---|---|
| Frontend | React + TypeScript + Vite |
| UI | TailwindCSS + DaisyUI + Recharts |
| Backend | .NET 10 Web API (C#) |
| Database | PostgreSQL + Entity Framework Core |
| Realtime | StateleSSE.AspNetCore (Server-Sent Events) |
| SSE Backplane | Redis |
| Messaging | MQTT via Mqtt.Controllers |
| Auth | JWT (Bearer token) |
| API Docs | OpenAPI (NSwag) + auto-generated TypeScript client |
| Deployment | Fly.io (separate apps for client and server) |
| Tooling | Docker / Docker Compose |

---

## Installation and Setup (Local)

### Clone repository

```bash
git clone https://github.com/OleksandrDarchyk/FullstackIoT_Exam.git
```

### Quick Start (Local)

| Step | What to do | Command (run from repo root unless noted) |
|---|---|---|
| 1 | Start database (PostgreSQL) + Redis | `cd server && docker compose up -d` |
| 2 | Start backend (.NET API) | `dotnet run --project server/api` |
| 3 | Start frontend (React) | `cd client` → `npm ci` → `npm run dev` |
| 4 | Open in browser | Frontend: http://localhost:5173 |

> On first run, migrations are applied and seed data (farm, turbines, test user) is inserted automatically.

---

## MQTT Topics

| Direction | Topic | Description |
|---|---|---|
| Subscribe | `farm/{farmId}/windmill/{turbineId}/telemetry` | Live sensor measurements |
| Subscribe | `farm/{farmId}/windmill/{turbineId}/alert` | Threshold alerts |
| Publish | `farm/{farmId}/windmill/{turbineId}/command` | Control commands |

---

## Configuration

`appsettings.Development.json` is intentionally committed to the repository. It contains only localhost connection strings and a development-only JWT secret — no production credentials. This allows anyone who clones the repo to run the project locally without any manual configuration.
