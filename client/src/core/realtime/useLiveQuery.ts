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

                const eventType = options?.eventType;
                if (eventType) {
                    unsub = stream.on<{ eventType: string; data?: T; Data?: T }>(
                        res.group,
                        eventType,
                        (dto) => setData((dto.data ?? dto.Data) as T)
                    );
                } else {
                    unsub = stream.onRaw<{ data?: T; Data?: T }>(
                        res.group,
                        (dto) => setData(((dto?.data ?? dto?.Data ?? dto) as unknown) as T)
                    );
                }
            } catch (e) {
                console.error("useLiveQuery subscribe failed:", e);
            }
        })();

        return () => {
            cancelled = true;
            unsub?.();
        };
        // stream is a new object every render but stream.on/onRaw delegate to a stable coreRef —
        // adding stream itself would cause infinite re-runs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stream.connectionId, subscribe, options?.eventType]);

    return { data, status: stream.status };
}
