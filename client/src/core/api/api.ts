import { BASE_URL } from "../config/BASE_URL";
import { customHttp } from "./customFetch";

import {
    AuthClient,
    TurbinesReadClient,
    TelemetryRealtimeClient,
    AlertRealtimeClient,
    TelemetryHistoryClient,
    AlertsHistoryClient,
    ActionsHistoryClient,
    TurbineCommandClient,
} from "../../generated-ts-client";

export const api = {
    auth: new AuthClient(BASE_URL, customHttp),

    turbines: new TurbinesReadClient(BASE_URL, customHttp),

    telemetryRealtime: new TelemetryRealtimeClient(BASE_URL, customHttp),
    alertsRealtime: new AlertRealtimeClient(BASE_URL, customHttp),

    telemetryHistory: new TelemetryHistoryClient(BASE_URL, customHttp),
    alertsHistory: new AlertsHistoryClient(BASE_URL, customHttp),
    actionsHistory: new ActionsHistoryClient(BASE_URL, customHttp),

    commands: new TurbineCommandClient(BASE_URL, customHttp),
};