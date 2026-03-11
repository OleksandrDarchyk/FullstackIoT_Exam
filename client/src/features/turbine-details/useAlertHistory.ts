import { useEffect, useState } from "react";
import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import type { AlertDto } from "@api/generated/generated-ts-client";

export type AlertPreset = "24h" | "7d";

const PRESET_MS: Record<AlertPreset, number> = {
    "24h": 86_400_000,
    "7d":  7 * 86_400_000,
};

export function useAlertHistory(turbineId: string) {
    const [preset, setPreset] = useState<AlertPreset>("24h");
    const [alertHistory, setAlertHistory] = useState<AlertDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!turbineId) {
            setAlertHistory([]);
            setLoading(false);
            return;
        }
        const fromIso = new Date(Date.now() - PRESET_MS[preset]).toISOString();
        setLoading(true);
        api.alertsHistory
            .getAlerts(turbineId, 100, fromIso, undefined)
            .then((data) => setAlertHistory(data ?? []))
            .catch(showApiError)
            .finally(() => setLoading(false));
    }, [turbineId, preset]);

    return { preset, setPreset, alertHistory, loading };
}
