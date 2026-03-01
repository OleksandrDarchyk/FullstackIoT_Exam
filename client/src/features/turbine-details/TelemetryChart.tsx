import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import type { MetricKey, Range } from "./useTelemetryHistory";
import { metricOptions } from "./useTelemetryHistory";

interface ChartPoint {
    time: string;
    value: number;
}

interface Props {
    chartData: ChartPoint[];
    metric: MetricKey;
    setMetric: (m: MetricKey) => void;
    range: Range;
    setRange: (r: Range) => void;
    meta: { label: string; unit: string };
    loading: boolean;
}

export function TelemetryChart({ chartData, metric, setMetric, range, setRange, meta, loading }: Props) {
    return (
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
                            {(["10m", "1h", "24h"] as Range[]).map((r) => (
                                <button
                                    key={r}
                                    className={`btn btn-sm join-item ${range === r ? "btn-primary" : "btn-ghost"}`}
                                    onClick={() => setRange(r)}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="divider" />

                <div className="h-72">
                    {loading ? (
                        <div className="flex items-center justify-center h-full opacity-70">
                            Loading…
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip
                                    formatter={(v: number | undefined) => [
                                        `${v} ${meta.unit}`,
                                        meta.label,
                                    ]}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    dot={false}
                                    strokeWidth={2}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="text-xs opacity-70 mt-2">
                    Server-filtered window · {chartData.length} points
                </div>
            </div>
        </div>
    );
}
