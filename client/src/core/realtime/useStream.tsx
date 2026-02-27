import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { CONNECT_EVENT, SSE_URL } from "../config/BASE_URL";

export type ConnectionStatus = "Connected" | "Reconnecting" | "Offline";

type StreamApi = {
    connectionId: string | null;
    status: ConnectionStatus;
    onRaw<T>(group: string, handler: (data: T) => void): () => void;
    on<T>(group: string, eventType: string, handler: (dto: T) => void): () => void;
};

const Ctx = createContext<StreamApi | null>(null);

type Handler = (dto: any) => void;

type GroupRegistryEntry = {
    esListener: (e: MessageEvent) => void;
    handlers: Set<Handler>;
};

export function StreamProvider({ children }: { children: React.ReactNode }) {
    const esRef = useRef<EventSource | null>(null);
    const groupsRef = useRef<Map<string, GroupRegistryEntry>>(new Map());
    const [connectionId, setConnectionId] = useState<string | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("Reconnecting");

    useEffect(() => {
        const es = new EventSource(SSE_URL);
        esRef.current = es;

        const onOpen = () => setStatus("Connected");

        const onError = () => {
            if (es.readyState === EventSource.CLOSED) setStatus("Offline");
            else setStatus("Reconnecting");
        };

        const tryReadConnectionId = (e: MessageEvent) => {
            try {
                const dto = JSON.parse(e.data);
                const id = dto?.connectionId ?? dto?.ConnectionId;
                if (typeof id === "string" && id.length > 0) setConnectionId(id);
            } catch {
                if (
                    typeof e.data === "string" &&
                    e.data.length > 10 &&
                    e.data.includes("-")
                ) {
                    setConnectionId(e.data);
                }
            }
        };

        es.addEventListener("open", onOpen as EventListener);
        es.addEventListener("error", onError as EventListener);
        es.addEventListener(CONNECT_EVENT, tryReadConnectionId as EventListener);
        es.addEventListener("connected", tryReadConnectionId as EventListener);
        es.addEventListener("ConnectionResponse", tryReadConnectionId as EventListener);
        es.addEventListener("message", tryReadConnectionId as EventListener);

        return () => {
            es.removeEventListener("open", onOpen as EventListener);
            es.removeEventListener("error", onError as EventListener);
            es.removeEventListener(CONNECT_EVENT, tryReadConnectionId as EventListener);
            es.removeEventListener("connected", tryReadConnectionId as EventListener);
            es.removeEventListener("ConnectionResponse", tryReadConnectionId as EventListener);
            es.removeEventListener("message", tryReadConnectionId as EventListener);

            for (const [group, entry] of groupsRef.current.entries()) {
                es.removeEventListener(group, entry.esListener as EventListener);
            }
            groupsRef.current.clear();

            es.close();
            esRef.current = null;
        };
    }, []);

    const api = useMemo<StreamApi>(() => {
        const ensureGroupListener = (group: string) => {
            const es = esRef.current;
            if (!es) return null;

            const existing = groupsRef.current.get(group);
            if (existing) return existing;

            const handlers = new Set<Handler>();

            const esListener = (e: MessageEvent) => {
                let dto: any;
                try {
                    dto = JSON.parse(e.data);
                } catch {
                    return;
                }

                handlers.forEach((h) => {
                    try {
                        h(dto);
                    } catch {
                        //
                    }
                });
            };

            const entry: GroupRegistryEntry = { esListener, handlers };
            groupsRef.current.set(group, entry);
            es.addEventListener(group, esListener as EventListener);
            return entry;
        };

        const onRaw = <T,>(group: string, handler: (data: T) => void) => {
            const entry = ensureGroupListener(group);
            if (!entry) return () => {};

            const h: Handler = (dto) => handler(dto as T);
            entry.handlers.add(h);

            return () => {
                entry.handlers.delete(h);

                if (entry.handlers.size === 0) {
                    const es = esRef.current;
                    if (es) es.removeEventListener(group, entry.esListener as EventListener);
                    groupsRef.current.delete(group);
                }
            };
        };

        const on = <T,>(group: string, eventType: string, handler: (dto: T) => void) => {
            return onRaw<any>(group, (dto) => {
                const et = dto?.eventType ?? dto?.EventType;
                if (et === eventType) handler(dto as T);
            });
        };

        return {
            connectionId,
            status,
            onRaw,
            on,
        };
    }, [connectionId, status]);

    return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStream() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error("useStream must be used inside StreamProvider");
    return ctx;
}
