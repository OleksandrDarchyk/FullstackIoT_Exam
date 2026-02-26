// Centralized API clients using NSwag generated classes.

import { BASE_URL } from "./config/BASE_URL";
import { customFetch } from "./api/customFetch";

import {
    TurbinesReadClient,
    TelemetryRealtimeClient,
    AlertRealtimeClient,
    TelemetryHistoryClient,
    AlertsHistoryClient,
    TurbineCommandClient,
    AuthClient,
    ActionsHistoryClient
} from "../generated-ts-client";

export const api = {

    // Turbine read endpoints
    turbines: new TurbinesReadClient(BASE_URL, customFetch),

    // Realtime subscriptions
    telemetryRealtime: new TelemetryRealtimeClient(BASE_URL, customFetch),
    alertsRealtime: new AlertRealtimeClient(BASE_URL, customFetch),

    // History endpoints
    telemetryHistory: new TelemetryHistoryClient(BASE_URL, customFetch),
    alertsHistory: new AlertsHistoryClient(BASE_URL, customFetch),
    actionsHistory: new ActionsHistoryClient(BASE_URL, customFetch),

    // Command endpoints (requires auth)
    commands: new TurbineCommandClient(BASE_URL, customFetch),

    // Authentication endpoints
    auth: new AuthClient(BASE_URL, customFetch),
};