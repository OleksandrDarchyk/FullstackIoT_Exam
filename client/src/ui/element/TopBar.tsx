import { Link, useNavigate } from "react-router-dom";
import { clearJwt, isLoggedIn } from "../../core/auth/jwt";
import { useStream } from "../../core/realtime/useStream";

export default function TopBar() {
    const nav = useNavigate();
    const loggedIn = isLoggedIn();
    const { status } = useStream();

    function logout() {
        clearJwt();
        nav("/login");
    }

    const statusCls =
        status === "Connected"
            ? "badge badge-success"
            : status === "Reconnecting"
                ? "badge badge-warning"
                : "badge badge-error";

    return (
        <div className="navbar bg-base-100 shadow sticky top-0 z-10">
            <div className="navbar-start">
                <Link className="btn btn-ghost text-xl" to="/turbines">
                    WindFarm
                </Link>
            </div>

            <div className="navbar-end gap-2">
                <span className={statusCls}>{status}</span>

                {loggedIn ? (
                    <button className="btn btn-outline btn-sm" onClick={logout}>
                        Logout
                    </button>
                ) : (
                    <Link className="btn btn-primary btn-sm" to="/login">
                        Login
                    </Link>
                )}
            </div>
        </div>
    );
}