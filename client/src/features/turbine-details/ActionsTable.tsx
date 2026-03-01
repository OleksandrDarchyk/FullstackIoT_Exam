import type { OperatorActionDto } from "@api/genereted/generated-ts-client";
import { hhmmss } from "@utils/hooks/time";

interface Props {
    actions: OperatorActionDto[];
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

function statusClass(status?: string): string {
    const s = String(status ?? "").toLowerCase();
    if (s === "sent") return "badge badge-success badge-sm";
    if (s === "failed") return "badge badge-error badge-sm";
    return "badge badge-warning badge-sm";
}

export function ActionsTable({ actions }: Props) {
    return (
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
                                {actions.map((a) => (
                                    <tr key={String(a.id)}>
                                        <td className="text-xs opacity-70 whitespace-nowrap">
                                            {hhmmss(a.requestedAt)}
                                        </td>
                                        <td className="text-xs">{a.username ?? "—"}</td>
                                        <td className="font-semibold">{a.action ?? "—"}</td>
                                        <td className="text-xs opacity-70">
                                            {parseParams(a.payloadJson)}
                                        </td>
                                        <td>
                                            <span className={statusClass(a.status)}>
                                                {a.status ?? "—"}
                                            </span>
                                            {a.validationError && (
                                                <div className="text-xs text-error mt-1">
                                                    {a.validationError}
                                                </div>
                                            )}
                                        </td>
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
