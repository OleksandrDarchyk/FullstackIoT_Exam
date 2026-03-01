import { useCallback, useEffect, useState } from "react";
import { api } from "@api/api";
import { showApiError } from "@api/customFetch";
import type { OperatorActionDto } from "@api/generated/generated-ts-client";

export function useActionsHistory(turbineId: string) {
    const [actions, setActions] = useState<OperatorActionDto[]>([]);

    const refetch = useCallback(async () => {
        try {
            const res = await api.actionsHistory.getActions(turbineId, 50);
            setActions(res ?? []);
        } catch (e) {
            showApiError(e);
        }
    }, [turbineId]);

    useEffect(() => {
        if (!turbineId) return;
        refetch();
    }, [turbineId, refetch]);

    return { actions, refetch };
}
