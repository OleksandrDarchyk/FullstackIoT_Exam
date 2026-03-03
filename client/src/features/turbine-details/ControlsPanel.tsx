import { useState } from "react";
import { Link } from "react-router-dom";
import type { TurbineCommand } from "./types";

interface Props {
    onSendCommand: (cmd: TurbineCommand) => Promise<void>;
    loggedIn: boolean;
    sending: boolean;
}

export function ControlsPanel({ onSendCommand, loggedIn, sending }: Props) {
    const [stopReason, setStopReason] = useState("");
    const [interval, setIntervalVal] = useState(10);
    const [pitch, setPitch] = useState(5);

    const disabled = !loggedIn || sending;

    return (
        <div className="card bg-base-100 shadow">
            <div className="card-body">
                <h2 className="card-title">Controls</h2>
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
                        disabled={disabled}
                        onClick={() => onSendCommand({ action: "start" })}
                    >
                        Start
                    </button>
                    <button
                        className="btn btn-error"
                        disabled={disabled}
                        onClick={() =>
                            onSendCommand({ action: "stop", reason: stopReason || undefined })
                        }
                    >
                        Stop
                    </button>
                </div>

                <input
                    className="input input-bordered w-full mt-3"
                    disabled={disabled}
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
                        disabled={disabled}
                        type="number"
                        min={1}
                        max={60}
                        value={interval}
                        onChange={(e) => setIntervalVal(Number(e.target.value))}
                    />
                    <button
                        className="btn btn-outline"
                        disabled={disabled || interval < 1 || interval > 60}
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
                        disabled={disabled}
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
                        disabled={disabled}
                        onClick={() => onSendCommand({ action: "setPitch", angle: pitch })}
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
