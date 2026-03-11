import { useEffect, useRef, useState } from "react";
import { StateleSSEClient } from "statele-sse";
import toast from "react-hot-toast";
import { api } from "@api/api";
import { SSE_URL } from "@api/config";
import { useAuthToken } from "@auth/jwt";
import type { AlertDto, OperatorActionDto, TelemetryPointDto } from "@api/generated/generated-ts-client";

const sseClient = new StateleSSEClient(SSE_URL);

function unwrapList<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object") {
        if ("data" in payload && Array.isArray((payload as { data?: unknown }).data))
            return (payload as { data: T[] }).data;
        if ("Data" in payload && Array.isArray((payload as { Data?: unknown }).Data))
            return (payload as { Data: T[] }).Data;
    }
    return [];
}

export function useTelemetryLive(turbineId: string) {
    const [data, setData] = useState<TelemetryPointDto[] | null>(null);

    useEffect(() => {
        if (!turbineId) { setData(null); return; }
        return sseClient.listen(
            async (id) => await api.telemetryRealtime.getTelemetry(id, turbineId),
            (payload) => setData(unwrapList<TelemetryPointDto>(payload))
        );
    }, [turbineId]);

    return { data };
}

export function useAlertsLive(turbineId: string) {
    const [data, setData] = useState<AlertDto[] | null>(null);

    useEffect(() => {
        if (!turbineId) { setData(null); return; }
        return sseClient.listen(
            async (id) => await api.alertsRealtime.getAlerts(id, turbineId),
            (payload) => setData(unwrapList<AlertDto>(payload))
        );
    }, [turbineId]);

    return { data };
}

export function useAlertsLiveAll() {
    const [data, setData] = useState<AlertDto[] | null>(null);

    useEffect(() => {
        return sseClient.listen(
            async (id) => await api.alertsRealtime.getAlerts(id, undefined),
            (payload) => setData(unwrapList<AlertDto>(payload))
        );
    }, []);

    return { data };
}

export function useAlertsLiveWithToast(turbineId: string) {
    const [data, setData] = useState<AlertDto[] | null>(null);
    const seenIds = useRef(new Set<number>());
    const initialized = useRef(false);

    useEffect(() => {
        seenIds.current = new Set();
        initialized.current = false;
    }, [turbineId]);

    useEffect(() => {
        if (!turbineId) { setData(null); return; }
        return sseClient.listen(
            async (id) => await api.alertsRealtime.getAlerts(id, turbineId),
            (payload) => {
                const list = unwrapList<AlertDto>(payload);
                setData(list);

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
            }
        );
    }, [turbineId]);

    return { data };
}

export function useActionsLive(turbineId: string) {
    const [data, setData] = useState<OperatorActionDto[] | null>(null);
    const token = useAuthToken();

    useEffect(() => {
        if (!turbineId || !token) { setData(null); return; }
        return sseClient.listen(
            async (id) => await api.actionsRealtime.getActions(id, turbineId),
            (payload) => setData(unwrapList<OperatorActionDto>(payload))
        );
    }, [turbineId, token]);

    return { data };
}
