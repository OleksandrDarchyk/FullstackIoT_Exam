const KEY = "jwt";

export function setJwt(token: string) {
    localStorage.setItem(KEY, token);
}

export function getJwt(): string | null {
    return localStorage.getItem(KEY);
}

export function clearJwt() {
    localStorage.removeItem(KEY);
}

export function isLoggedIn() {
    return !!getJwt();
}