import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../core/api/api";
import { setJwt } from "../../core/auth/jwt";
import { showApiError } from "../../core/api/customFetch";

export default function LoginPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onLogin() {
        setLoading(true);
        try {
            const res = await api.auth.login({ username, password });
            if (!res?.token) {
                toast.error("Login failed");
                return;
            }
            setJwt(res.token);
            toast.success("Logged in");
            nav("/turbines");
        } catch (e) {
            showApiError(e);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-xl">
                <div className="card-body gap-4">
                    <div>
                        <h1 className="card-title text-2xl">Sign in</h1>
                        <p className="text-sm opacity-60 mt-1">
                            Guest can view data; commands require login.
                        </p>
                    </div>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Username</legend>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </fieldset>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Password</legend>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            placeholder="your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            onKeyDown={(e) => e.key === "Enter" && onLogin()}
                        />
                    </fieldset>

                    <button
                        className="btn btn-primary w-full mt-2"
                        onClick={onLogin}
                        disabled={loading}
                    >
                        {loading && <span className="loading loading-spinner loading-sm" />}
                        Sign In
                    </button>

                    <p className="text-center text-sm opacity-60">
                        No account?{" "}
                        <Link to="/register" className="link link-primary">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
