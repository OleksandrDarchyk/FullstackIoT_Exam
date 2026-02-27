import toast from "react-hot-toast";
import { getJwt } from "../auth/jwt";
import { ApiException } from "../../generated-ts-client";

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

    // Don't show a toast here — NSwag may throw ApiException with more detail later.
    return res;
}

// Adapter object NSwag constructors accept as the http parameter.
export const customHttp = { fetch: customFetch };

// Extracts a readable message from NSwag ApiException / ProblemDetails and shows a toast.
export function showApiError(err: unknown) {
    if (ApiException.isApiException(err)) {
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