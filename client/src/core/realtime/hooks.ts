import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "../api/api";
import { useLiveQuery } from "./useLiveQuery";
import type { Alert, TelemetryRecord } from "../../generated-ts-client";

export function useTelemetryLive(turbineId: string) {
    const subscribe = useCallback(async (connectionId: string) => {
        if (!turbineId) return { group: undefined, data: undefined as TelemetryRecord[] | undefined };
        return await api.telemetryRealtime.getTelemetry(connectionId, turbineId);
    }, [turbineId]);

    return useLiveQuery<TelemetryRecord[]>(subscribe);
}

export function useAlertsLive(turbineId: string) {
    const subscribe = useCallback(async (connectionId: string) => {
        if (!turbineId) return { group: undefined, data: undefined as Alert[] | undefined };
        return await api.alertsRealtime.getAlerts(connectionId, turbineId);
    }, [turbineId]);

    return useLiveQuery<Alert[]>(subscribe);
}

export function useAlertsLiveWithToast(turbineId: string) {
    const base = useAlertsLive(turbineId);
    const seenIds = useRef(new Set<number>());
    const initialized = useRef(false);

    useEffect(() => {
        seenIds.current = new Set();
        initialized.current = false;
    }, [turbineId]);

    useEffect(() => {
        const list = base.data;
        if (!list) return;

        if (!initialized.current) {
            list.forEach(a => { if (a.id != null) seenIds.current.add(a.id as number); });
            initialized.current = true;
            return;
        }

        const fresh = list.filter(a => a.id != null && !seenIds.current.has(a.id as number));
        fresh.forEach(a => seenIds.current.add(a.id as number));
        fresh.slice(0, 3).forEach(a => {
            const sev = (a.severity ?? "").toLowerCase();
            const msg = `${a.turbineId ?? "turbine"}: ${a.message ?? "alert"}`;
            if (sev === "critical") toast.error(msg);
            else toast(msg, { icon: "⚠️" });
        });
    }, [base.data]);

    return base;
}

export function useAlertsLiveAll() {
    const subscribe = useCallback(async (connectionId: string) => {
        return await api.alertsRealtime.getAlerts(connectionId, undefined);
    }, []);

    return useLiveQuery<Alert[]>(subscribe);
}