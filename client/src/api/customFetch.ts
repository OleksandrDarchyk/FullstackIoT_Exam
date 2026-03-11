import toast from "react-hot-toast";
import { getJwt, clearJwt } from "../auth/jwt";
import { ApiException } from "@api/generated/generated-ts-client";

export async function customFetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    const token = getJwt();
    const headers = new Headers(init?.headers ?? {});

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    let res: Response;
    try {
        res = await fetch(url, { ...init, headers });
    } catch (e) {
        toast.error("Network error. Please try again.");
        throw e;
    }

    if (res.status === 401) {
        const hadToken = !!getJwt();
        clearJwt(); // also dispatches auth:logout (see jwt.ts)
        if (hadToken) {
            toast.error("Session expired. Please sign in again.");
        }
    }

    return res;
}

// Adapter object NSwag constructors accept as the http parameter.
export const customHttp = { fetch: customFetch };

// Extracts a readable message from NSwag ApiException / ProblemDetails and shows a toast.
export function showApiError(err: unknown) {
    if (ApiException.isApiException(err)) {
        // 401 is already handled by customFetch (toast + clearJwt); avoid a duplicate toast.
        if (err.status === 401) return;

        // err.response is raw text — try to parse it as ProblemDetails JSON.
        try {
            const parsed = JSON.parse(err.response);
            const msg =
                parsed?.detail ||
                parsed?.title ||
                `Request failed (HTTP ${err.status})`;
            toast.error(msg);
            return;
        } catch {
            toast.error(`Request failed (HTTP ${err.status})`);
            return;
        }
    }

    toast.error("Unexpected error");
}