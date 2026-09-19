import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const API_URL = "http://localhost:5000/api/auth/login";

function Login({ onLogin }) {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            setError("Please enter your email and password.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(
                    data.message || "Invalid email or password."
                );
                return;
            }

            const user = data.user;

            if (onLogin) {
                onLogin(user);
            }

            if (rememberMe) {
                localStorage.setItem(
                    "hydrocontrol_user",
                    JSON.stringify(user)
                );
            } else {
                sessionStorage.setItem(
                    "hydrocontrol_user",
                    JSON.stringify(user)
                );
            }

            navigate("/dashboard");

        } catch (error) {
            console.error("Login error:", error);

            setError(
                "Unable to connect to the HydroControl server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

            {/* BACKGROUND DECORATION */}
            <div className="login-background">
                <div className="login-orb orb-one"></div>
                <div className="login-orb orb-two"></div>
                <div className="login-orb orb-three"></div>
                <div className="login-grid"></div>
            </div>

            {/* LOGIN CONTAINER */}
            <main className="login-container">

                {/* LOGIN CARD */}
                <section className="login-card">

                    <div className="login-card-header">

                        <div className="mobile-login-logo">
                            🌱
                        </div>

                        <h2 className="login-card-label">
                            ADMIN PORTAL
                        </h2>

                    </div>

                    {/* ERROR */}
                    {error && (
                        <div className="login-error">
                            <span>⚠</span>
                            {error}
                        </div>
                    )}

                    {/* FORM */}
                    <form onSubmit={handleSubmit}>

                        {/* EMAIL */}
                        <div className="form-group">

                            <label htmlFor="email">
                                EMAIL ADDRESS
                            </label>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    ✉
                                </span>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@hydrocontrol.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />

                            </div>

                        </div>

                        {/* PASSWORD */}
                        <div className="form-group">

                            <div className="password-label-row">

                                <label htmlFor="password">
                                    PASSWORD
                                </label>

                            </div>

                            <div className="input-wrapper">

                                <span className="input-icon">
                                    🔒
                                </span>

                                <input
                                    id="password"
                                    name="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? "🙈" : "👁"}
                                </button>

                            </div>

                        </div>

                        {/* OPTIONS */}
                        <div className="login-options">

                            <label className="remember-option">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(
                                            e.target.checked
                                        )
                                    }
                                />

                                <span className="custom-checkbox"></span>

                                Remember me

                            </label>

                        </div>

                        {/* LOGIN */}
                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >

                            <span className="login-text">
                                {loading
                                    ? "Signing In..."
                                    : "Sign In"}
                            </span>

                            <span className="login-arrow">
                                →
                            </span>

                        </button>

                    </form>

                    {/* DIVIDER */}
                    <div className="login-divider">
                        <span>
                            SECURE ACCESS
                        </span>
                    </div>

                    {/* SECURITY */}
                    <div className="security-info">

                        <div className="security-icon">
                            🛡️
                        </div>

                        <div>

                            <strong>
                                Secure Authentication
                            </strong>

                            <span>
                                Your connection is protected
                                by HydroControl security.
                            </span>

                        </div>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Login;
