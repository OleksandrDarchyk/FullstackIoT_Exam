import type { AlertDto } from "@api/genereted/generated-ts-client";
import type { AlertPreset } from "./useAlertHistory";
import { SeverityBadge } from "@ui/element/Badges";
import { hhmmss } from "@utils/hooks/time";

interface Props {
    alertHistory: AlertDto[];
    preset: AlertPreset;
    setPreset: (p: AlertPreset) => void;
    loading: boolean;
}

export function AlertHistoryPanel({ alertHistory, preset, setPreset, loading }: Props) {
    return (
        <div className="mt-4 card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="card-title">Alert History</h2>
                    <div className="join">
                        <button
                            className={`btn btn-sm join-item ${preset === "24h" ? "btn-primary" : "btn-ghost"}`}
                            onClick={() => setPreset("24h")}
                        >
                            Last 24h
                        </button>
                        <button
                            className={`btn btn-sm join-item ${preset === "7d" ? "btn-primary" : "btn-ghost"}`}
                            onClick={() => setPreset("7d")}
                        >
                            Last 7 days
                        </button>
                    </div>
                </div>
                <div className="divider" />

                {loading ? (
                    <div className="opacity-70">Loading…</div>
                ) : alertHistory.length === 0 ? (
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
                                        <td className="text-xs opacity-70 whitespace-nowrap">
                                            {hhmmss(a.ts)}
                                        </td>
                                        <td>
                                            <SeverityBadge severity={a.severity} />
                                        </td>
                                        <td>{a.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
