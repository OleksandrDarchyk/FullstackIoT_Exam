import { useState } from "react";
import { api } from "../../core/api";

export default function LoginPage() {
    const [username, setUsername] = useState("test");
    const [password, setPassword] = useState("pass1234");

    return (
        <div style={{ maxWidth: 360 }}>
            <h2>Login</h2>

            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <input
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={() => {
                        api.auth.login({ username, password }).then((r) => {
                            localStorage.setItem("jwt", r.token);
                            alert("Logged in");
                        });
                    }}
                >
                    Sign in
                </button>

                <button
                    onClick={() => {
                        api.auth.register({ username, password }).then((r) => {
                            localStorage.setItem("jwt", r.token);
                            alert("Account created");
                        });
                    }}
                >
                    Create account
                </button>
            </div>
        </div>
    );
}