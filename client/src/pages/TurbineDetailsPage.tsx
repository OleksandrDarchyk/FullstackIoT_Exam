import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import { useAlertsLiveWithToast, useTelemetryLive } from "@core/realtime/hooks";
import { SeverityBadge, StatusBadge } from "@ui/Badges";
import { hhmmss, timeAgo } from "../utils/time";

import type { TurbineDto, TelemetryPointDto } from "@api/generated/generated-ts-client";
import type { TurbineCommand } from "@features/turbine-details/types";

import { useActionsHistory } from "@features/turbine-details/useActionsHistory";
import { useAlertHistory } from "@features/turbine-details/useAlertHistory";
import { useTelemetryHistory } from "@features/turbine-details/useTelemetryHistory";
import { useTurbineCommands } from "@features/turbine-details/useTurbineCommands";

import { ActionsTable } from "@features/turbine-details/ActionsTable";
import { AlertHistoryPanel } from "@features/turbine-details/AlertHistoryPanel";
import { TelemetryChart } from "@features/turbine-details/TelemetryChart";
import { ControlsPanel } from "@features/turbine-details/ControlsPanel";

export default function TurbineDetailsPage() {
    const { turbineId } = useParams();
    const id = turbineId ?? "";

    // ── live data ──────────────────────────────────────────────────────────
    const { data: telemetryList } = useTelemetryLive(id);
    const { data: liveAlerts } = useAlertsLiveWithToast(id);

    const latest: TelemetryPointDto | undefined = telemetryList?.reduce<TelemetryPointDto | undefined>(
        (best, cur) => (!best || (cur.ts ?? "") > (best.ts ?? "") ? cur : best),
        undefined
    );

    // ── turbine metadata ───────────────────────────────────────────────────
    const [turbine, setTurbine] = useState<TurbineDto | null>(null);

    useEffect(() => {
        if (!id) return;
        api.turbines.getAll()
            .then((all) => setTurbine((all ?? []).find((x) => x.turbineId === id) ?? null))
            .catch(showApiError);
    }, [id]);

    // ── feature hooks ──────────────────────────────────────────────────────
    const { actions, refetch: refetchActions } = useActionsHistory(id);
    const telemetry = useTelemetryHistory(id);
    const alertHist = useAlertHistory(id);
    const { sendCommand, loggedIn, sending } = useTurbineCommands(id);

    // ── compositor: send + refresh actions ────────────────────────────────
    const onSendCommand = useCallback(async (cmd: TurbineCommand) => {
        await sendCommand(cmd);
        await refetchActions();
    }, [sendCommand, refetchActions]);

    // ── guard ──────────────────────────────────────────────────────────────
    if (!id) {
        return (
            <div className="min-h-screen bg-base-200">
                <div className="max-w-6xl mx-auto p-4">
                    <div className="card bg-base-100 shadow">
                        <div className="card-body">Missing turbineId</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
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
                    {/* LEFT — 2 cols */}
                    <div className="lg:col-span-2 grid gap-4">
                        {/* Live metrics */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h2 className="card-title">Live Metrics</h2>
                                <div className="divider" />
                                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                                    <MetricTile label="Wind"      value={latest?.windSpeed}         unit="m/s" />
                                    <MetricTile label="Power"     value={latest?.powerOutput}        unit="MW"  />
                                    <MetricTile label="Rotor"     value={latest?.rotorSpeed}         unit="rpm" />
                                    <MetricTile label="Gen Temp"  value={latest?.generatorTemp}      unit="°C"  />
                                    <MetricTile label="Gearbox"   value={latest?.gearboxTemp}        unit="°C"  />
                                    <MetricTile label="Vibration" value={latest?.vibration}          unit=""    />
                                    <MetricTile label="Pitch"     value={latest?.bladePitch}         unit="°"   />
                                    <MetricTile label="Wind Dir"  value={latest?.windDirection}      unit="°"   />
                                    <MetricTile label="Ambient"   value={latest?.ambientTemperature} unit="°C"  />
                                    <MetricTile label="Nacelle"   value={latest?.nacelleDirection}   unit="°"   />
                                </div>
                            </div>
                        </div>

                        <TelemetryChart
                            chartData={telemetry.chartData}
                            metric={telemetry.metric}
                            setMetric={telemetry.setMetric}
                            range={telemetry.range}
                            setRange={telemetry.setRange}
                            meta={telemetry.meta}
                            loading={telemetry.loading}
                        />
                    </div>

                    {/* RIGHT */}
                    <div className="grid gap-4">
                        <ControlsPanel
                            onSendCommand={onSendCommand}
                            loggedIn={loggedIn}
                            sending={sending}
                        />

                        {/* Live alerts */}
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <h2 className="card-title">Live Alerts</h2>
                                <div className="divider" />

                                {!liveAlerts || liveAlerts.length === 0 ? (
                                    <div className="opacity-70">No alerts</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {liveAlerts.slice(0, 10).map((a) => (
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

                <ActionsTable actions={actions} />

                <AlertHistoryPanel
                    alertHistory={alertHist.alertHistory}
                    preset={alertHist.preset}
                    setPreset={alertHist.setPreset}
                    loading={alertHist.loading}
                />

                <div className="h-6" />
            </div>
        </div>
    );
}

function MetricTile({ label, value, unit }: { label: string; value?: number; unit: string }) {
    return (
        <div className="bg-base-200 rounded-box p-3">
            <div className="text-xs opacity-60">{label}</div>
            <div className="text-lg font-extrabold">
                {typeof value === "number" ? value.toFixed(1) : "—"}
                {" "}
                <span className="text-xs font-semibold opacity-60">{unit}</span>
            </div>
        </div>
    );
}
