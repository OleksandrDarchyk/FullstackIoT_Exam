const local = "http://localhost:5039";
const prod = "https://MY-IOT-API.fly.dev";

export const BASE_URL = import.meta.env.PROD ? prod : local;
export const SSE_URL = `${BASE_URL}/sse`;
export const CONNECT_EVENT = "connected";