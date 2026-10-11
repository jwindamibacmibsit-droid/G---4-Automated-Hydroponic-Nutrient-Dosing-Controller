
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../css/login.css";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // ==========================================
    // HANDLE INPUT
    // ==========================================
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");
    };

    // ==========================================
    // LOGIN
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const email = formData.email.trim();
        const password = formData.password;

        if (!email || !password) {
            setError("Please enter your email and password.");
            return;
        }

        if (!API_URL) {
            setError("The API URL is not configured.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // 1. Authenticate and request a server session.
            const response = await fetch(
                `${API_URL.replace(/\/+$/, "")}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        rememberMe
                    })
                }
            );

            const data = await response.json().catch(() => null);

            // 2. Reject unsuccessful authentication.
            if (
                !response.ok ||
                !data?.success ||
                !data?.user
            ) {
                setError(
                    data?.message ||
                    "Invalid email or password."
                );
                return;
            }

            // 3. Confirm the cookie can authenticate a new request.
            const sessionResponse = await fetch(
                `${API_URL.replace(/\/+$/, "")}/api/auth/session`,
                {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store"
                }
            );

            const sessionData = await sessionResponse
                .json()
                .catch(() => null);

            if (
                !sessionResponse.ok ||
                !sessionData?.authenticated ||
                !sessionData?.user?.id
            ) {
                setError(
                    "Login succeeded, but the session could not be verified. Check your cookie and server configuration."
                );
                return;
            }

            // 4. Store the verified user in React state only.
            login(sessionData.user);

            // 5. Navigate after session verification.
            navigate("/dashboard", { replace: true });

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            setError(
                "Unable to connect to the HydroControl server. Check your network and API URL."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // RENDER
    // ==========================================
    return (
        <div className="login-page">
            <div className="login-background">
                <div className="login-orb orb-one"></div>
                <div className="login-orb orb-two"></div>
                <div className="login-orb orb-three"></div>
                <div className="login-grid"></div>
            </div>

            <main className="login-container">
                <section className="login-card">
                    <div className="login-card-header">
                        <div className="mobile-login-logo">
                            🌱
                        </div>

                        <h2 className="login-card-label">
                            ADMIN PORTAL
                        </h2>
                    </div>

                    {error && (
                        <div className="login-error" role="alert">
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">
                                EMAIL ADDRESS
                            </label>

                            <div className="input-wrapper">
                                <span className="input-icon">✉</span>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@hydrocontrol.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="username"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="password-label-row">
                                <label htmlFor="password">
                                    PASSWORD
                                </label>
                            </div>

                            <div className="input-wrapper">
                                <span className="input-icon">🔒</span>

                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? "--" : "👁"}
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="remember-option">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                    disabled={loading}
                                />

                                <span className="custom-checkbox"></span>
                                Remember me
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            <span className="login-text">
                                {loading ? "Signing In..." : "Sign In"}
                            </span>

                            <span className="login-arrow">→</span>
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>SECURE ACCESS</span>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Login;
