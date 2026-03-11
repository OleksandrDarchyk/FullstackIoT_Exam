import { useEffect, useMemo, useState } from "react";
import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import { hhmmss } from "@utils/time";
import type { TelemetryPointDto } from "@api/generated/generated-ts-client";

export type MetricKey =
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

export type Range = "10m" | "1h" | "24h";

export const metricOptions: { key: MetricKey; label: string; unit: string }[] = [
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

const RANGE_MS: Record<Range, number> = {
    "10m": 10 * 60_000,
    "1h":  60 * 60_000,
    "24h": 24 * 60 * 60_000,
};

const RANGE_LIMIT: Record<Range, number> = {
    "10m": 200,
    "1h":  600,
    "24h": 2000,
};

export function useTelemetryHistory(turbineId: string, livePoints?: TelemetryPointDto[] | null) {
    const [range, setRange] = useState<Range>("10m");
    const [metric, setMetric] = useState<MetricKey>("windSpeed");
    const [points, setPoints] = useState<TelemetryPointDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!turbineId) {
            setPoints([]);
            setLoading(false);
            return;
        }
        const fromIso = new Date(Date.now() - RANGE_MS[range]).toISOString();
        setLoading(true);
        api.telemetryHistory
            .getHistory(turbineId, RANGE_LIMIT[range], fromIso, undefined)
            .then((data) => setPoints(data ?? []))
            .catch(showApiError)
            .finally(() => setLoading(false));
    }, [turbineId, range]);

    const meta = metricOptions.find((x) => x.key === metric) ?? metricOptions[0];

    const chartData = useMemo(() => {
        const cutoff = Date.now() - RANGE_MS[range];
        const extra = range !== "24h" ? (livePoints ?? []) : [];
        const seen = new Set<string>();
        return [...extra, ...points]
            .filter((x) => x.ts != null && new Date(x.ts).getTime() >= cutoff)
            .sort((a, b) => (a.ts! < b.ts! ? -1 : a.ts! > b.ts! ? 1 : 0))
            .filter((x) => {
                const key = String(x.ts);
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .map((x) => ({
                time: hhmmss(x.ts),
                value: (x as Record<string, number | undefined>)[metric] ?? 0,
            }));
    }, [points, livePoints, metric, range]);

    return { range, setRange, metric, setMetric, chartData, meta, loading };
}
