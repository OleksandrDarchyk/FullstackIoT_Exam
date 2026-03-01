export type TurbineCommand =
    | { action: "start" }
    | { action: "stop"; reason?: string }
    | { action: "setInterval"; value: number }
    | { action: "setPitch"; angle: number };
