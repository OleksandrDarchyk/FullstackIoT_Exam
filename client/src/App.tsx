import { useEffect, useState } from "react";
import "./App.css";
import { api } from "./core/api";
import { useRealtimeListen } from "./core/realtime/useRealtimeListen";
import type { TelemetryRecord, TurbineDto } from "./generated-ts-client";

function App() {
    const [turbines, setTurbines] = useState<TurbineDto[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
    const [telemetryError, setTelemetryError] = useState<string | null>(null);

    useEffect(() => {
        api.turbines
            .getAll()
            .then(setTurbines)
            .catch((e) => setError(String(e)));
    }, []);

    useRealtimeListen<TelemetryRecord[]>(
        (id) => api.telemetryRealtime.getTelemetry(id, "turbine-alpha"),
        (data) => setTelemetry(data),
        [],
        (err) => setTelemetryError(String(err))
    );

    const last = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

    return (
        <div style={{ padding: 16 }}>
            <h2>Turbines</h2>

            {error && <div style={{ marginTop: 12 }}>Error: {error}</div>}

            <ul style={{ marginTop: 12 }}>
                {turbines.map((t) => (
                    <li key={t.turbineId}>
                        {t.turbineId} — {t.name ?? "Unnamed"} ({t.location ?? "Unknown"})
                    </li>
                ))}
            </ul>

            <div style={{ marginTop: 24 }}>
                <h3>Telemetry (turbine-alpha)</h3>

                {telemetryError && <div>Error: {telemetryError}</div>}

                <div>Items: {telemetry.length}</div>

                <pre style={{ fontSize: 12, overflow: "auto", maxHeight: 240 }}>
          {JSON.stringify(last, null, 2)}
        </pre>
            </div>
        </div>
    );
}

export default App;