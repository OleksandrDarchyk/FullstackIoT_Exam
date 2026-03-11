import { useEffect, useState } from "react";
import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import { useAuthToken } from "@auth/jwt";
import type { OperatorActionDto } from "@api/generated/generated-ts-client";

export function useActionsHistory(turbineId: string) {
    const [actions, setActions] = useState<OperatorActionDto[] | null>(null);
    const [loading, setLoading] = useState(false);
    const token = useAuthToken();

    useEffect(() => {
        if (!turbineId || !token) {
            setActions(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.actionsHistory
            .getActions(turbineId, undefined)
            .then((data) => setActions(data ?? []))
            .catch(showApiError)
            .finally(() => setLoading(false));
    }, [turbineId, token]);

    return { actions, loading };
}
