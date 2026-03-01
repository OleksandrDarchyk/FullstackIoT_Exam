import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { StreamProvider } from "@core/realtime/useStream";
import router from "./router";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <StreamProvider>
            <RouterProvider router={router} />
            <Toaster position="bottom-right" />
        </StreamProvider>
    </React.StrictMode>
);