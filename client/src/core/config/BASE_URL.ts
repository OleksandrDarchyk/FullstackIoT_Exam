const local = "http://localhost:5039";
const prod = "https://API_DOMAIN"; // TODO: Replace with the Fly.io API base URL once deployed.

export const BASE_URL = import.meta.env.PROD ? prod : local;