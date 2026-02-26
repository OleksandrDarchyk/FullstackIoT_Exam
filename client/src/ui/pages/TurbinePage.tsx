import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { api } from "../../core/api";
import { useRealtimeListen } from "../../core/realtime/useRealtimeListen";
import type { TelemetryRecord } from "../../generated-ts-client";

export default function TurbinePage() {
    const { turbineId } = useParams<{ turbineId: string }>();
    const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
    const [telemetryError, setTelemetryError] = useState<string | null>(null);

    const id = turbineId ?? "turbine-alpha";

    useRealtimeListen<TelemetryRecord[]>(
        (connectionId) => api.telemetryRealtime.getTelemetry(connectionId, id),
        (data) => setTelemetry(data),
        [id],
        (err) => setTelemetryError(String(err))
    );

    const last = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <Link to="/turbines">← Back</Link>
                    <h2 style={{ marginTop: 8 }}>{id}</h2>
                </div>
            </div>

            <div style={{ marginTop: 16 }}>
                <h3>Live Telemetry</h3>
                {telemetryError && <div>Error: {telemetryError}</div>}
                <div>Items: {telemetry.length}</div>

                <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 280 }}>
          {JSON.stringify(last, null, 2)}
        </pre>
            </div>
        </div>
    );
}