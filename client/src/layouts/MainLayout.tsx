import { Outlet } from "react-router-dom";
import TopBar from "@ui/element/TopBar";

export default function MainLayout() {
    return (
        <>
            <TopBar />
            <main>
                <Outlet />
            </main>
        </>
    );
}
