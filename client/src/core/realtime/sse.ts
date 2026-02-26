import { StateleSSEClient } from "statele-sse";
import { BASE_URL } from "../config/BASE_URL";

export const sse = new StateleSSEClient(`${BASE_URL}/sse`);