import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import TopBar from "../element/TopBar";
import { api } from "../../core/api/api";
import { showApiError } from "../../core/api/customFetch";
import { isLoggedIn } from "../../core/auth/jwt";
import { useAlertsLiveWithToast, useTelemetryLive } from "../../core/realtime/hooks";
import { SeverityBadge, StatusBadge } from "../element/Badges";
import { hhmmss, timeAgo } from "../../utils/time";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import type {
    AlertDto,
    OperatorActionDto,
    TelemetryPointDto,
    TelemetryRecord,
    TurbineDto,
} from "../../generated-ts-client";

type MetricKey =
    | "windSpeed"
    | "windDirection"
    | "ambientTemperature"
    | "powerOutput"
    | "rotorSpeed"
    | "nacelleDirection"
    | "generatorTemp"
    | "gearboxTemp"
    | "vibration"
    | "bladePitch";

type TurbineCommand =
    | { action: "start" }
    | { action: "stop"; reason?: string }
    | { action: "setInterval"; value: number }
    | { action: "setPitch"; angle: number };

const metricOptions: { key: MetricKey; label: string; unit: string }[] = [
    { key: "windSpeed", label: "Wind Speed", unit: "m/s" },
    { key: "windDirection", label: "Wind Direction", unit: "°" },
    { key: "ambientTemperature", label: "Ambient Temp", unit: "°C" },
    { key: "powerOutput", label: "Power Output", unit: "MW" },
    { key: "rotorSpeed", label: "Rotor Speed", unit: "rpm" },
    { key: "nacelleDirection", label: "Nacelle Direction", unit: "°" },
    { key: "generatorTemp", label: "Generator Temp", unit: "°C" },
    { key: "gearboxTemp", label: "Gearbox Temp", unit: "°C" },
    { key: "vibration", label: "Vibration", unit: "" },
    { key: "bladePitch", label: "Blade Pitch", unit: "°" },
];

export default function TurbineDetailsPage() {
    const { turbineId } = useParams();
    const id = turbineId ?? "";

    const { data: telemetryList } = useTelemetryLive(id);
    const { data: alerts } = useAlertsLiveWithToast(id);

    const latest: TelemetryRecord | undefined = telemetryList?.slice(-1)[0];

    const [metric, setMetric] = useState<MetricKey>("windSpeed");
    const [range, setRange] = useState<"10m" | "1h" | "24h">("10m");

    const [actions, setActions] = useState<OperatorActionDto[]>([]);
    const [turbine, setTurbine] = useState<TurbineDto | null>(null);
    const [chartHistory, setChartHistory] = useState<TelemetryPointDto[]>([]);

    // alert history
    const [alertHistoryPreset, setAlertHistoryPreset] = useState<"24h" | "7d">("24h");
    const [alertHistory, setAlertHistory] = useState<AlertDto[]>([]);

    // controls state
    const [stopReason, setStopReason] = useState("");
    const [interval, setIntervalVal] = useState<number>(10);
    const [pitch, setPitch] = useState<number>(5);

    const loggedIn = isLoggedIn();

    useEffect(() => {
        if (!id) return;

        (async () => {
            try {
                const all = await api.turbines.getAll();
                setTurbine((all ?? []).find((x) => x.turbineId === id) ?? null);
            } catch (e) {
                showApiError(e);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const limit = range === "10m" ? 200 : range === "1h" ? 600 : 2000;
        api.telemetryHistory.getHistory(id, limit)
            .then((data) => setChartHistory(data ?? []))
            .catch(showApiError);
    }, [id, range]);

    async function loadActions() {
        try {
            const res = await api.actionsHistory.getActions(id, 50);
            setActions(res ?? []);
        } catch (e) {
            showApiError(e);
        }
    }

    useEffect(() => {
        if (!id) return;
        loadActions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (!id) return;
        const fromIso = new Date(Date.now() - (alertHistoryPreset === "24h" ? 86_400_000 : 7 * 86_400_000)).toISOString();
        api.alertsHistory.getAlerts(id, 100, fromIso, null)
            .then((data) => setAlertHistory(data ?? []))
            .catch(showApiError);
    }, [id, alertHistoryPreset]);

    const chartData = useMemo(() => {
        const now = Date.now();
        const ms =
            range === "10m"
                ? 10 * 60_000
                : range === "1h"
                    ? 60 * 60_000
                    : 24 * 60 * 60_000;

        return chartHistory
            .filter((x) => {
                const t = x.ts ? Date.parse(x.ts) : 0;
                return t >= now - ms;
            })
            .map((x) => ({
                time: hhmmss(x.ts),
                value: (x as Record<string, number | undefined>)[metric],
            }));
    }, [chartHistory, metric, range]);

    async function sendCommand(command: TurbineCommand) {
        if (!loggedIn) {
            toast.error("Please sign in to send commands");
            return;
        }

        try {
            await api.commands.sendCommand(id, command);
            toast.success("Command sent");
            await loadActions();
        } catch (e) {
            showApiError(e);
        }
    }

    const meta = metricOptions.find((x) => x.key === metric) ?? metricOptions[0];

    if (!id) {
        return (
            <>
                <TopBar />
                <div className="min-h-screen bg-base-200">
                    <div className="max-w-6xl mx-auto p-4">
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">Missing turbineId</div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TopBar />

            <div className="min-h-screen bg-base-200">
                <div className="max-w-6xl mx-auto p-4">
                    <Link className="link link-hover opacity-70" to="/turbines">
                        ← Back to Dashboard
                    </Link>

                    {/* Header */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-extrabold">{turbine?.name ?? id}</h1>
                            <div className="opacity-70 text-sm">
                                {turbine?.location ?? "Unknown"} · {id}
                            </div>
                        </div>

                        <div className="sm:text-right">
                            <StatusBadge status={latest?.status} />
                            <div className="opacity-70 text-xs mt-2">
                                Last update: {hhmmss(latest?.ts)} · {timeAgo(latest?.ts)}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        {/* LEFT (2 cols) */}
                        <div className="lg:col-span-2 grid gap-4">
                            {/* Live metrics */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h2 className="card-title">Live Metrics</h2>
                                    <div className="divider" />

                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                                        <MetricTile label="Wind" value={latest?.windSpeed} unit="m/s" />
                                        <MetricTile label="Power" value={latest?.powerOutput} unit="MW" />
                                        <MetricTile label="Rotor" value={latest?.rotorSpeed} unit="rpm" />
                                        <MetricTile label="Gen Temp" value={latest?.generatorTemp} unit="°C" />
                                        <MetricTile label="Gearbox" value={latest?.gearboxTemp} unit="°C" />
                                        <MetricTile label="Vibration" value={latest?.vibration} unit="" />
                                        <MetricTile label="Pitch" value={latest?.bladePitch} unit="°" />
                                        <MetricTile label="Wind Dir" value={latest?.windDirection} unit="°" />
                                        <MetricTile label="Ambient" value={latest?.ambientTemperature} unit="°C" />
                                        <MetricTile label="Nacelle" value={latest?.nacelleDirection} unit="°" />
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <h2 className="card-title">Chart</h2>

                                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                            <select
                                                className="select select-bordered select-sm w-full sm:w-60"
                                                value={metric}
                                                onChange={(e) => setMetric(e.target.value as MetricKey)}
                                            >
                                                {metricOptions.map((o) => (
                                                    <option key={o.key} value={o.key}>
                                                        {o.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <div className="join">
                                                <button
                                                    className={`btn btn-sm join-item ${
                                                        range === "10m" ? "btn-primary" : "btn-ghost"
                                                    }`}
                                                    onClick={() => setRange("10m")}
                                                >
                                                    10m
                                                </button>
                                                <button
                                                    className={`btn btn-sm join-item ${
                                                        range === "1h" ? "btn-primary" : "btn-ghost"
                                                    }`}
                                                    onClick={() => setRange("1h")}
                                                >
                                                    1h
                                                </button>
                                                <button
                                                    className={`btn btn-sm join-item ${
                                                        range === "24h" ? "btn-primary" : "btn-ghost"
                                                    }`}
                                                    onClick={() => setRange("24h")}
                                                >
                                                    24h
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divider" />

                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                                <YAxis />
                                                <Tooltip
                                                    formatter={(v: number | string | undefined) => [
                                                        `${v ?? "—"} ${meta.unit}`,
                                                        meta.label,
                                                    ]}
                                                />
                                                <Line type="monotone" dataKey="value" dot={false} strokeWidth={2} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="text-xs opacity-70 mt-2">
                                        Live-updating bounded window (no infinite growth).
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT */}
                        <div className="grid gap-4">
                            {/* Controls */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h2 className="card-title">Controls</h2>
                                    <div className="divider" />

                                    {!loggedIn && (
                                        <div className="alert alert-warning">
                                            <span>Please sign in to send commands</span>
                                            <Link className="btn btn-sm" to="/login">
                                                Sign in
                                            </Link>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap mt-2">
                                        <button
                                            className="btn btn-success"
                                            disabled={!loggedIn}
                                            onClick={() => sendCommand({ action: "start" })}
                                        >
                                            Start
                                        </button>

                                        <button
                                            className="btn btn-error"
                                            disabled={!loggedIn}
                                            onClick={() =>
                                                sendCommand({ action: "stop", reason: stopReason || undefined })
                                            }
                                        >
                                            Stop
                                        </button>
                                    </div>

                                    <input
                                        className="input input-bordered w-full mt-3"
                                        disabled={!loggedIn}
                                        value={stopReason}
                                        onChange={(e) => setStopReason(e.target.value)}
                                        placeholder="Stop reason (optional)"
                                    />

                                    <div className="divider" />

                                    <div className="text-sm opacity-70">Reporting interval (1–60s)</div>
                                    <div className="flex gap-2 items-center mt-2">
                                        <input
                                            className="input input-bordered w-28"
                                            disabled={!loggedIn}
                                            type="number"
                                            min={1}
                                            max={60}
                                            value={interval}
                                            onChange={(e) => setIntervalVal(Number(e.target.value))}
                                        />
                                        <button
                                            className="btn btn-outline"
                                            disabled={!loggedIn}
                                            onClick={() => sendCommand({ action: "setInterval", value: interval })}
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <div className="mt-4 text-sm opacity-70">Blade pitch (0–30°)</div>
                                    <div className="flex gap-2 items-center mt-2">
                                        <input
                                            className="range range-primary w-full"
                                            disabled={!loggedIn}
                                            type="range"
                                            min={0}
                                            max={30}
                                            step={0.5}
                                            value={pitch}
                                            onChange={(e) => setPitch(Number(e.target.value))}
                                        />
                                        <span className="badge badge-neutral w-20 justify-center">
                      {pitch.toFixed(1)}°
                    </span>
                                        <button
                                            className="btn btn-outline"
                                            disabled={!loggedIn}
                                            onClick={() => sendCommand({ action: "setPitch", angle: pitch })}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Live Alerts */}
                            <div className="card bg-base-100 shadow">
                                <div className="card-body">
                                    <h2 className="card-title">Live Alerts</h2>
                                    <div className="divider" />

                                    {!alerts || alerts.length === 0 ? (
                                        <div className="opacity-70">No alerts</div>
                                    ) : (
                                        <div className="grid gap-2">
                                            {alerts.slice(0, 10).map((a) => (
                                                <div key={String(a.id)} className="card bg-base-200">
                                                    <div className="card-body p-4">
                                                        <div className="flex items-center justify-between gap-3">
                                                            <SeverityBadge severity={a.severity} />
                                                            <div className="text-xs opacity-60">
                                                                {hhmmss(a.ts)} · {timeAgo(a.ts)}
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 font-bold">{a.message}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Action History */}
                    <div className="mt-4 card bg-base-100 shadow">
                        <div className="card-body">
                            <h2 className="card-title">Operator Actions</h2>
                            <div className="divider" />

                            {actions.length === 0 ? (
                                <div className="opacity-70">No actions yet</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>User</th>
                                                <th>Action</th>
                                                <th>Parameters</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {actions.map((a) => {
                                                const st = String(a.status ?? "").toLowerCase();
                                                const statusCls =
                                                    st === "sent"
                                                        ? "badge badge-success badge-sm"
                                                        : st === "failed"
                                                            ? "badge badge-error badge-sm"
                                                            : "badge badge-warning badge-sm";
                                                return (
                                                    <tr key={String(a.id)}>
                                                        <td className="text-xs opacity-70 whitespace-nowrap">{hhmmss(a.requestedAt)}</td>
                                                        <td className="text-xs">{a.username ?? "—"}</td>
                                                        <td className="font-semibold">{a.action ?? "—"}</td>
                                                        <td className="text-xs opacity-70">{parseParams(a.payloadJson)}</td>
                                                        <td>
                                                            <span className={statusCls}>{a.status ?? "—"}</span>
                                                            {a.validationError && (
                                                                <div className="text-xs text-error mt-1">{a.validationError}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alert History */}
                    <div className="mt-4 card bg-base-100 shadow">
                        <div className="card-body">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="card-title">Alert History</h2>
                                <div className="join">
                                    <button
                                        className={`btn btn-sm join-item ${alertHistoryPreset === "24h" ? "btn-primary" : "btn-ghost"}`}
                                        onClick={() => setAlertHistoryPreset("24h")}
                                    >
                                        Last 24h
                                    </button>
                                    <button
                                        className={`btn btn-sm join-item ${alertHistoryPreset === "7d" ? "btn-primary" : "btn-ghost"}`}
                                        onClick={() => setAlertHistoryPreset("7d")}
                                    >
                                        Last 7 days
                                    </button>
                                </div>
                            </div>
                            <div className="divider" />

                            {alertHistory.length === 0 ? (
                                <div className="opacity-70">No alerts in this period</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Severity</th>
                                                <th>Message</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alertHistory.map((a) => (
                                                <tr key={String(a.id)}>
                                                    <td className="text-xs opacity-70 whitespace-nowrap">{hhmmss(a.ts)}</td>
                                                    <td><SeverityBadge severity={a.severity} /></td>
                                                    <td>{a.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-6" />
                </div>
            </div>
        </>
    );
}

function parseParams(payloadJson?: string): string {
    if (!payloadJson) return "—";
    try {
        const obj = JSON.parse(payloadJson) as Record<string, unknown>;
        const pairs = Object.entries(obj)
            .filter(([k]) => k !== "action")
            .map(([k, v]) => `${k}: ${v}`);
        return pairs.length ? pairs.join(", ") : "—";
    } catch {
        return "—";
    }
}

function MetricTile({
                        label,
                        value,
                        unit,
                    }: {
    label: string;
    value?: number;
    unit: string;
}) {
    const display = typeof value === "number" ? value.toFixed(1) : "—";

    return (
        <div className="bg-base-200 rounded-box p-3">
            <div className="text-xs opacity-60">{label}</div>
            <div className="text-lg font-extrabold">
                {display}{" "}
                <span className="text-xs font-semibold opacity-60">{unit}</span>
            </div>
        </div>
    );
}