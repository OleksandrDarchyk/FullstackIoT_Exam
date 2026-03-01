import { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { api } from "@api/api";
import { useLiveQuery } from "./useLiveQuery";
import type { AlertDto, TelemetryPointDto } from "@api/generated/generated-ts-client";

export function useTelemetryLive(turbineId: string) {
    const subscribe = useCallback(async (connectionId: string) => {
        if (!turbineId) return { group: undefined, data: undefined as TelemetryPointDto[] | undefined };
        return await api.telemetryRealtime.getTelemetry(connectionId, turbineId);
    }, [turbineId]);

    return useLiveQuery<TelemetryPointDto[]>(subscribe);
}

export function useAlertsLive(turbineId: string) {
    const subscribe = useCallback(async (connectionId: string) => {
        if (!turbineId) return { group: undefined, data: undefined as AlertDto[] | undefined };
        return await api.alertsRealtime.getAlerts(connectionId, turbineId);
    }, [turbineId]);

    return useLiveQuery<AlertDto[]>(subscribe);
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
            list.forEach(a => { if (a.id != null) seenIds.current.add(a.id); });
            initialized.current = true;
            return;
        }

        const fresh = list.filter(a => a.id != null && !seenIds.current.has(a.id));
        fresh.forEach(a => seenIds.current.add(a.id!));
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

    return useLiveQuery<AlertDto[]>(subscribe);
}