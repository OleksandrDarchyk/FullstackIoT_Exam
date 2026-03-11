import { useEffect, useState } from "react";

const KEY = "jwt";

export function setJwt(token: string) {
    localStorage.setItem(KEY, token);
    window.dispatchEvent(new CustomEvent("auth:login"));
}

export function getJwt(): string | null {
    return localStorage.getItem(KEY);
}

export function clearJwt() {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent("auth:logout"));
}

export function isLoggedIn() {
    return !!getJwt();
}

/**
 * Reactive hook — re-renders when auth state changes (login or logout).
 * Returns the current JWT (null when signed out).
 * All auth-guarded hooks use this as a dep instead of calling isLoggedIn() once.
 */
export function useAuthToken(): string | null {
    const [token, setToken] = useState(getJwt);
    useEffect(() => {
        function sync() { setToken(getJwt()); }
        window.addEventListener("auth:login", sync);
        window.addEventListener("auth:logout", sync);
        return () => {
            window.removeEventListener("auth:login", sync);
            window.removeEventListener("auth:logout", sync);
        };
    }, []);
    return token;
}