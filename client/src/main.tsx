import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { StreamProvider } from "@core/realtime/useStream";
import { SSE_URL, CONNECT_EVENT } from "@api/config";
import router from "./router";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <StreamProvider config={{ urlForStreamEndpoint: SSE_URL, connectEvent: CONNECT_EVENT }}>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
        </StreamProvider>
    </React.StrictMode>
);