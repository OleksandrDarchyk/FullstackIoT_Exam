import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

export type ConnectionStatus = "Connected" | "Reconnecting" | "Offline";

interface BaseResponseDto {
    eventType?: string;
}

export interface StreamConfig {
    /** The SSE endpoint URL (e.g., "http://localhost:5000/Connect") */
    urlForStreamEndpoint: string;
    /** The SSE event name that delivers the connection response (e.g., "ConnectionResponse") */
    connectEvent: string;
}

type Unsubscribe = () => void;

export interface Stream {
    /** The connection ID assigned by the server */
    connectionId: string | null;
    /** Whether the connection is established */
    isConnected: boolean;
    status: ConnectionStatus;
    on<T>(
        group: string,
        eventType: string,
        handler: (dto: T) => void
    ): Unsubscribe;
    /** Listen for any message on a group, regardless of eventType. */
    onRaw<T>(group: string, handler: (dto: T) => void): Unsubscribe;
}

export class StreamError extends Error {
    constructor(message: string) {
        super(`[useStream] ${message}`);
        this.name = "StreamError";
    }
}

function assertNonEmpty(value: string, name: string): void {
    if (!value || value.trim() === "") {
        throw new StreamError(`${name} cannot be empty`);
    }
}

type Listener = {
    group: string;
    eventType: string;
    handler: (dto: unknown) => void;
};

class StreamCore {
    private eventSource: EventSource | null = null;
    private listeners = new Map<symbol, Listener>();
    private groupHandlers = new Map<string, (e: MessageEvent) => void>();
    private pendingGroups = new Set<string>();
    private isDisconnected = false;

    connectionId: string | null = null;
    onConnectionChange: ((id: string | null) => void) | null = null;
    onStatusChange: ((status: ConnectionStatus) => void) | null = null;

    connect(config: StreamConfig) {
        assertNonEmpty(config.urlForStreamEndpoint, "config.url");
        assertNonEmpty(config.connectEvent, "config.connectEvent");

        if (this.eventSource) {
            throw new StreamError("Already connected. Call disconnect() first.");
        }

        this.isDisconnected = false;
        this.eventSource = new EventSource(config.urlForStreamEndpoint);

        // Attach handlers for any groups registered before connect
        for (const group of this.pendingGroups) {
            this.attachGroupHandler(group);
        }
        this.pendingGroups.clear();

        this.eventSource.onopen = () => {
            this.onStatusChange?.("Connected");
        };

        this.eventSource.addEventListener(config.connectEvent, (e) => {
            const data = JSON.parse(e.data);
            this.connectionId = data?.connectionId ?? null;
            this.onConnectionChange?.(this.connectionId);
        });

        this.eventSource.onerror = () => {
            console.error("[stream] EventSource connection error");
            if (this.eventSource?.readyState === EventSource.CLOSED) {
                this.onStatusChange?.("Offline");
            } else {
                this.onStatusChange?.("Reconnecting");
            }
        };
    }

    disconnect() {
        this.isDisconnected = true;
        this.eventSource?.close();
        this.eventSource = null;
        this.connectionId = null;
        this.listeners.clear();
        this.groupHandlers.clear();
        this.pendingGroups.clear();
    }

    on<T>(
        group: string,
        eventType: string,
        handler: (dto: T) => void
    ): Unsubscribe {
        assertNonEmpty(group, "group");
        assertNonEmpty(eventType, "eventType");

        if (typeof handler !== "function") {
            throw new StreamError("handler must be a function");
        }

        if (this.isDisconnected) {
            throw new StreamError(
                "Cannot register listener after disconnect. This usually means you're calling on() outside of a useEffect, or the component unmounted."
            );
        }

        const key = Symbol();

        this.listeners.set(key, {
            group,
            eventType,
            handler: handler as (dto: unknown) => void,
        });
        this.ensureGroupHandler(group);

        return () => {
            this.listeners.delete(key);
            this.maybeRemoveGroupHandler(group);
        };
    }

    onRaw<T>(group: string, handler: (dto: T) => void): Unsubscribe {
        return this.on<T>(group, "*", handler);
    }

    private ensureGroupHandler(group: string) {
        if (this.groupHandlers.has(group)) return;

        if (!this.eventSource) {
            // EventSource not ready yet, queue for later
            this.pendingGroups.add(group);
            return;
        }

        this.attachGroupHandler(group);
    }

    private attachGroupHandler(group: string) {
        if (this.groupHandlers.has(group) || !this.eventSource) return;

        const handler = (e: MessageEvent) => {
            let data: BaseResponseDto;
            try {
                data = JSON.parse(e.data) as BaseResponseDto;
            } catch {
                console.error(`[stream] Failed to parse message on group "${group}":`, e.data);
                return;
            }

            const eventType = data.eventType;
            if (!eventType) {
                console.warn(`[stream] Received message without eventType on group "${group}":`, data);
                return;
            }

            for (const listener of this.listeners.values()) {
                if (listener.group === group && (listener.eventType === eventType || listener.eventType === "*")) {
                    try {
                        listener.handler(data);
                    } catch (err) {
                        console.error(`[stream] Handler error for ${group}/${eventType}:`, err);
                    }
                }
            }
        };

        this.eventSource.addEventListener(group, handler);
        this.groupHandlers.set(group, handler);
    }

    private maybeRemoveGroupHandler(group: string) {
        // Check if any listener still needs this group
        for (const listener of this.listeners.values()) {
            if (listener.group === group) return;
        }

        const handler = this.groupHandlers.get(group);
        if (handler && this.eventSource) {
            this.eventSource.removeEventListener(group, handler);
        }
        this.groupHandlers.delete(group);
    }
}

const StreamContext = createContext<Stream | null>(null);

export interface StreamProviderProps {
    config: StreamConfig;
    children: ReactNode;
}

export function StreamProvider({ config, children }: StreamProviderProps) {
    const coreRef = useRef<StreamCore | null>(null);
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("Reconnecting");

    if (!coreRef.current) {
        coreRef.current = new StreamCore();
    }

    useEffect(() => {
        const core = coreRef.current!;
        core.onConnectionChange = setConnectionId;
        core.onStatusChange = setStatus;
        core.connect(config);

        return () => {
            core.disconnect();
        };
        // using primitive fields instead of the config object to avoid reconnecting
        // when the parent re-renders with a structurally identical but new config reference
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.urlForStreamEndpoint, config.connectEvent]);

    const stream: Stream = {
        connectionId,
        isConnected: connectionId !== null,
        status,
        on: (group, eventType, handler) => coreRef.current!.on(group, eventType, handler),
        onRaw: (group, handler) => coreRef.current!.onRaw(group, handler),
    };

    return (
        <StreamContext.Provider value={stream}>
            {children}
        </StreamContext.Provider>
    );
}

/** @throws {StreamError} If used outside of StreamProvider */
// eslint-disable-next-line react-refresh/only-export-components
export function useStream(): Stream {
    const stream = useContext(StreamContext);
    if (!stream) {
        throw new StreamError(
            "useStream must be used within a StreamProvider. " +
            "Wrap your app with <StreamProvider config={...}>."
        );
    }
    return stream;
}