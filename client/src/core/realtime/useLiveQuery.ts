import { useEffect, useState } from "react";
import { useStream } from "./useStream";

export type RealtimeListenResponse<T> = { group?: string; data?: T };

export function useLiveQuery<T>(
    subscribe: (connectionId: string) => Promise<RealtimeListenResponse<T>>,
    options?: { eventType?: string }
) {
    const stream = useStream();
    const [data, setData] = useState<T | null>(null);

    useEffect(() => {
        if (!stream.connectionId) return;

        let unsub: (() => void) | null = null;
        let cancelled = false;

        (async () => {
            try {
                const res = await subscribe(stream.connectionId!);
                if (cancelled) return;

                if (!res.group) throw new Error("Subscribe did not return 'group'");

                setData((res.data ?? null) as T | null);

                unsub = options?.eventType
                    ? stream.on<T>(res.group, options.eventType, (dto) => setData(dto))
                    : stream.onRaw<T>(res.group, (dto) => setData(dto));
            } catch (e) {
                console.error("useLiveQuery subscribe failed:", e);
            }
        })();

        return () => {
            cancelled = true;
            unsub?.();
        };
    }, [stream, subscribe, options?.eventType]);

    return { data, status: stream.status };
}