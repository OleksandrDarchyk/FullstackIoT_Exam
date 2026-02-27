import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { StreamProvider } from "./core/realtime/useStream";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <StreamProvider>
                <App />
                <Toaster position="bottom-right" />
            </StreamProvider>
        </BrowserRouter>
    </React.StrictMode>
);