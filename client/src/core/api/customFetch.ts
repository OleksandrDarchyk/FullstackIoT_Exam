// Custom fetch used by all NSwag clients.
// Adds JWT token automatically and handles API errors.

export const customFetch = {
    async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {

        const token = localStorage.getItem("jwt");

        const headers = new Headers(init?.headers);

        // Attach Authorization header if token exists
        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        headers.set("Accept", "application/json");

        const response = await fetch(url, {
            ...init,
            headers
        });

        // Show ProblemDetails error message if returned by backend
        if (!response.ok) {
            const clone = response.clone();
            try {
                const problem = await clone.json();
                if (problem?.detail) alert(problem.detail);
            } catch {}
        }

        return response;
    },
};