import { Navigate, Route, Routes } from "react-router-dom";
import TurbinesPage from "./ui/pages/TurbinePage";
import TurbineDetailsPage from "./ui/pages/TurbineDetailsPage";
import LoginPage from "./ui/pages/LoginPage";
import RegisterPage from "./ui/pages/RegisterPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/turbines" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/turbines" element={<TurbinesPage />} />
            <Route path="/turbines/:turbineId" element={<TurbineDetailsPage />} />
            <Route path="*" element={<Navigate to="/turbines" replace />} />
        </Routes>
    );
}