const local = "http://localhost:5233";

//TODO: add prod domain from fly.io when deployed
//const prod  = "https://API_DOMAIN";

export const BASE_URL = import.meta.env.PROD ? prod : local;