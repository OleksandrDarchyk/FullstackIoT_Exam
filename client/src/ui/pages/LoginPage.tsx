import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../core/api/api";
import { setJwt } from "../../core/auth/jwt";
import { showApiError } from "../../core/api/customFetch";

export default function LoginPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    async function onLogin() {
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
        }
    }

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
            <div className="card w-full max-w-md bg-base-100 shadow">
                <div className="card-body">
                    <h1 className="card-title text-2xl">Login</h1>
                    <p className="opacity-70">
                        Guest can view data; commands require login.
                    </p>

                    <div className="divider" />

                    <label className="form-control w-full">
                        <div className="label">
                            <span className="label-text">Username</span>
                        </div>
                        <input
                            className="input input-bordered w-full"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                    </label>

                    <label className="form-control w-full mt-2">
                        <div className="label">
                            <span className="label-text">Password</span>
                        </div>
                        <input
                            className="input input-bordered w-full"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </label>

                    <div className="card-actions mt-4">
                        <button className="btn btn-primary w-full" onClick={onLogin}>
                            Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}