import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../element/TopBar";
import { api } from "../../core/api/api";
import { showApiError } from "../../core/api/customFetch";
import type { TurbineDto, TelemetryRecord } from "../../generated-ts-client";
import { useAlertsLiveAll, useTelemetryLive } from "../../core/realtime/hooks";
import { SeverityBadge, StatusBadge } from "../element/Badges";
import { hhmmss, timeAgo } from "../../utils/time";

function TurbineCard({ t }: { t: TurbineDto }) {
    const id = t.turbineId ?? "";
    const { data } = useTelemetryLive(id);
    const latest: TelemetryRecord | undefined = data?.slice(-1)[0];

    const wind = latest?.windSpeed;
    const power = latest?.powerOutput;
    const rotor = latest?.rotorSpeed;

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="card-title">{t.name ?? id}</h2>
                        <div className="text-xs opacity-60">
                            {t.location ?? "Unknown"} · {id}
                        </div>
                    </div>

                    <StatusBadge status={latest?.status} />
                </div>

                <div className="stats stats-horizontal bg-base-200 shadow mt-3">
                    <div className="stat">
                        <div className="stat-title text-xs">Wind</div>
                        <div className="stat-value text-xl">
                            {typeof wind === "number" ? wind.toFixed(1) : "—"}
                        </div>
                        <div className="stat-desc">m/s</div>
                    </div>

                    <div className="stat">
                        <div className="stat-title text-xs">Power</div>
                        <div className="stat-value text-xl">
                            {typeof power === "number" ? power.toFixed(1) : "—"}
                        </div>
                        <div className="stat-desc">MW</div>
                    </div>

                    <div className="stat">
                        <div className="stat-title text-xs">Rotor</div>
                        <div className="stat-value text-xl">
                            {typeof rotor === "number" ? rotor.toFixed(1) : "—"}
                        </div>
                        <div className="stat-desc">rpm</div>
                    </div>
                </div>

                <div className="text-xs opacity-70 mt-3">
                    Last update: {hhmmss(latest?.ts)} · {timeAgo(latest?.ts)}
                </div>

                <div className="card-actions mt-4">
                    <Link className="btn btn-outline btn-sm" to={`/turbines/${id}`}>
                        Open →
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function TurbinesPage() {
    const [turbines, setTurbines] = useState<TurbineDto[]>([]);
    const [loading, setLoading] = useState(true);

    const { data: alerts } = useAlertsLiveAll();

    useEffect(() => {
        (async () => {
            try {
                const res = await api.turbines.getAll();
                setTurbines(res ?? []);
            } catch (e) {
                showApiError(e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <>
            <TopBar />

            <div className="min-h-screen bg-base-200">
                <div className="max-w-6xl mx-auto p-4">
                    <div className="mb-4">
                        <h1 className="text-3xl font-extrabold">Farm Overview</h1>
                        <div className="opacity-70">Live metrics + latest alerts.</div>
                    </div>

                    {loading ? (
                        <div className="opacity-70">Loading turbines…</div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {turbines.map((t) => (
                                <TurbineCard key={t.turbineId ?? ""} t={t} />
                            ))}
                        </div>
                    )}

                    <div className="mt-6 card bg-base-100 shadow">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <h2 className="card-title">Latest Alerts</h2>
                                <div className="text-xs opacity-60">Realtime</div>
                            </div>

                            <div className="divider" />

                            {!alerts || alerts.length === 0 ? (
                                <div className="opacity-70">No active alerts</div>
                            ) : (
                                <div className="grid gap-2">
                                    {alerts.slice(0, 10).map((a) => (
                                        <div key={String(a.id)} className="card bg-base-200">
                                            <div className="card-body p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <SeverityBadge severity={a.severity} />
                                                        <div>
                                                            <div className="font-bold">{a.message}</div>
                                                            <div className="text-xs opacity-60">
                                                                {a.turbineId ?? "—"}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-xs opacity-60">
                                                        {hhmmss(a.ts)} · {timeAgo(a.ts)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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