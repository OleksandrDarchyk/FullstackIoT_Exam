import { Link, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LoginPage from "./ui/pages/LoginPage";
import TurbinesPage from "./ui/pages/TurbinesPage";
import TurbinePage from "./ui/pages/TurbinePage";

export default function App() {
    return (
        <div style={{ padding: 16 }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to="/turbines" style={{ textDecoration: "none", fontWeight: 600 }}>
                    Wind Farm Dashboard
                </Link>

                <nav style={{ display: "flex", gap: 12 }}>
                    <Link to="/turbines">Turbines</Link>
                    <Link to="/login">Login</Link>
                </nav>
            </header>

            <div style={{ marginTop: 16 }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/turbines" replace />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/turbines" element={<TurbinesPage />} />
                    <Route path="/turbines/:turbineId" element={<TurbinePage />} />
                </Routes>
            </div>
        </div>
    );
}