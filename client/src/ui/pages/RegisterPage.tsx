import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../core/api/api";
import { setJwt } from "../../core/auth/jwt";
import { showApiError } from "../../core/api/customFetch";

export default function RegisterPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    async function onRegister() {
        setLoading(true);
        try {
            const res = await api.auth.register({ username, password });
            if (!res?.token) {
                toast.error("Registration failed");
                return;
            }
            setJwt(res.token);
            toast.success("Account created!");
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
                        <h1 className="card-title text-2xl">Create account</h1>
                        <p className="text-sm opacity-60 mt-1">
                            Operators can send commands to turbines.
                        </p>
                    </div>

                    <fieldset className="fieldset">
                        <legend className="fieldset-legend">Username</legend>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="min. 3 characters"
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
                            placeholder="min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            onKeyDown={(e) => e.key === "Enter" && onRegister()}
                        />
                    </fieldset>

                    <button
                        className="btn btn-primary w-full mt-2"
                        onClick={onRegister}
                        disabled={loading}
                    >
                        {loading && <span className="loading loading-spinner loading-sm" />}
                        Register
                    </button>

                    <p className="text-center text-sm opacity-60">
                        Already have an account?{" "}
                        <Link to="/login" className="link link-primary">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
