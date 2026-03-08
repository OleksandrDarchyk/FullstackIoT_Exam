import { Link, useNavigate } from "react-router-dom";
import { clearJwt, isLoggedIn } from "@auth/jwt";

export default function TopBar() {
    const nav = useNavigate();
    const loggedIn = isLoggedIn();

    function logout() {
        clearJwt();
        nav("/login");
    }

    return (
        <div className="navbar bg-base-100 shadow sticky top-0 z-10">
            <div className="navbar-start">
                <Link className="btn btn-ghost text-xl" to="/turbines">
                    WindFarm
                </Link>
            </div>

            <div className="navbar-end gap-2">
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