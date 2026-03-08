import { useState } from "react";
import { Link } from "react-router-dom";
import type { TurbineCommand } from "./types";

interface Props {
    onSendCommand: (cmd: TurbineCommand) => Promise<void>;
    loggedIn: boolean;
    sending: boolean;
    status?: string;
}

export function ControlsPanel({ onSendCommand, loggedIn, sending, status }: Props) {
    const [stopReason, setStopReason] = useState("");
    const [interval, setIntervalVal] = useState(10);
    const [pitch, setPitch] = useState(5);

    const s = (status ?? "offline").toLowerCase();
    const offline = s === "offline";
    const running = s === "running";
    const stopped = s === "stopped";

    const canStart    = loggedIn && !sending && !running;
    const canStop     = loggedIn && !sending && !offline && !stopped;
    const canInterval = loggedIn && !sending && !offline;
    const canPitch    = loggedIn && !sending && !offline && running;

    const statusLabel = offline ? "OFFLINE" : running ? "RUNNING" : "STOPPED";
    const statusCls   = offline ? "badge badge-warning" : running ? "badge badge-success" : "badge badge-neutral";

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <div className="flex items-center justify-between">
                    <h2 className="card-title">Controls</h2>
                    <span className={statusCls}>{statusLabel}</span>
                </div>
                <div className="divider" />

                {!loggedIn && (
                    <div className="alert alert-warning">
                        <span>Please sign in to send commands</span>
                        <Link className="btn btn-sm" to="/login">
                            Sign in
                        </Link>
                    </div>
                )}

                {/* Start / Stop */}
                <div className="flex gap-2 flex-wrap mt-2">
                    <button
                        className="btn btn-success"
                        disabled={!canStart}
                        onClick={() => onSendCommand({ action: "start" })}
                    >
                        Start
                    </button>
                    <button
                        className="btn btn-error"
                        disabled={!canStop}
                        onClick={() =>
                            onSendCommand({ action: "stop", reason: stopReason || undefined })
                        }
                    >
                        Stop
                    </button>
                </div>

                <input
                    className="input input-bordered w-full mt-3"
                    disabled={!canStop}
                    value={stopReason}
                    onChange={(e) => setStopReason(e.target.value)}
                    placeholder="Stop reason (optional)"
                />

                <div className="divider" />

                {/* Reporting interval */}
                <div className="text-sm opacity-70">Reporting interval (1–60 s)</div>
                <div className="flex gap-2 items-center mt-2">
                    <input
                        className="input input-bordered w-28"
                        disabled={!canInterval}
                        type="number"
                        min={1}
                        max={60}
                        value={interval}
                        onChange={(e) => setIntervalVal(Number(e.target.value))}
                    />
                    <button
                        className="btn btn-outline"
                        disabled={!canInterval || interval < 1 || interval > 60}
                        onClick={() => onSendCommand({ action: "setInterval", value: interval })}
                    >
                        Apply
                    </button>
                </div>

                {/* Blade pitch */}
                <div className="mt-4 text-sm opacity-70">Blade pitch (0–30°)</div>
                <div className="flex gap-2 items-center mt-2">
                    <input
                        className="range range-primary w-full"
                        disabled={!canPitch}
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
                        disabled={!canPitch}
                        onClick={() => onSendCommand({ action: "setPitch", angle: pitch })}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
