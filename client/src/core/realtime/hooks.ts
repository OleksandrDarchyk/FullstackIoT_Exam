import { useCallback } from "react";
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

export function useAlertsLiveAll() {
    const subscribe = useCallback(async (connectionId: string) => {
        return await api.alertsRealtime.getAlerts(connectionId, undefined);
    }, []);

    return useLiveQuery<Alert[]>(subscribe);
}