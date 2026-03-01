import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from "react-router-dom";
import MainLayout from "@layouts/MainLayout";
import LoginPage from "@pages/LoginPage";
import RegisterPage from "@pages/RegisterPage";
import TurbinesPage from "@pages/TurbinePage";
import TurbineDetailsPage from "@pages/TurbineDetailsPage";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/turbines" replace />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="turbines" element={<TurbinesPage />} />
            <Route path="turbines/:turbineId" element={<TurbineDetailsPage />} />
            <Route path="*" element={<Navigate to="/turbines" replace />} />
        </Route>
    )
);

export default router;
