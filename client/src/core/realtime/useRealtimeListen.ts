import { useEffect } from "react";
import { sse } from "./sse";

type ListenResponse<T> = { group: string; data?: T };

export function useRealtimeListen<T>(
    register: (connectionId: string) => Promise<ListenResponse<T>>,
    onData: (data: T) => void,
    deps: unknown[] = [],
    onError?: (err: unknown) => void
) {
    useEffect(() => {
        const unsub = sse.listen<T>(register, onData, onError);
        return () => unsub();
    }, deps);
}