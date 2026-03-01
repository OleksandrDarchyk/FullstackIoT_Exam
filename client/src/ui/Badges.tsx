export function StatusBadge({ status }: { status?: string }) {
    const s = (status ?? "unknown").toLowerCase();

    const cls =
        s === "running" ? "badge badge-success" :
            s === "stopped" ? "badge badge-neutral" :
                "badge badge-warning";

    return <span className={cls}>{status ?? "Unknown"}</span>;
}

export function SeverityBadge({ severity }: { severity?: string }) {
    const s = (severity ?? "info").toLowerCase();

    const cls =
        s === "critical" ? "badge badge-error" :
            s === "warning" ? "badge badge-warning" :
                "badge badge-info";

    return <span className={cls}>{severity ?? "Info"}</span>;
}