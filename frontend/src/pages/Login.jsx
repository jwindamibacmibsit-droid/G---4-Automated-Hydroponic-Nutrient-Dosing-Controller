import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const API_URL = (
    import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function Login({ onLogin }) {
    const navigate = useNavigate();

    // ==========================================
    // STATE
    // ==========================================

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

    if (!formData.email.trim() || !formData.password) {
        setError("Please enter your email and password.");
        return;
    }

    setError("");
    setLoading(true);

    try {
        // 1. Authenticate with the backend.
        const response = await fetch(
            `${API_URL}/api/auth/login`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: formData.email.trim(),
                    password: formData.password
                })
            }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.success !== true) {
            throw new Error(
                data.message || `Login failed (${response.status}).`
            );
        }

        // 2. Confirm that the browser can use the new session.
        const sessionResponse = await fetch(
            `${API_URL}/api/auth/session`,
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        const sessionData = await sessionResponse
            .json()
            .catch(() => ({}));

        if (
            !sessionResponse.ok ||
            sessionData.authenticated !== true
        ) {
            throw new Error(
                "Login succeeded, but the session cookie was not verified. Check your API cookie and session configuration."
            );
        }

        // Use the server-verified user information.
        const user = sessionData.user || data.user;

        if (!user?.id) {
            throw new Error("The server did not return a valid user.");
        }

        // 3. Update the app's user state.
        if (onLogin) {
            onLogin(user);
        }

        // These storage entries are for UI convenience only.
        // They do not replace server-side authentication.
        if (rememberMe) {
            localStorage.setItem(
                "hydrocontrol_user",
                JSON.stringify(user)
            );
            sessionStorage.removeItem("hydrocontrol_user");
        } else {
            sessionStorage.setItem(
                "hydrocontrol_user",
                JSON.stringify(user)
            );
            localStorage.removeItem("hydrocontrol_user");
        }

        // 4. Navigate only after verifying the session.
        navigate("/dashboard", { replace: true });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        setError(error.message || "Unable to log in.");
    } finally {
        setLoading(false);
    }
};

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div className="login-page">

            {/* =====================================
                BACKGROUND
            ====================================== */}

            <div className="login-background">

                <div className="login-orb orb-one"></div>

                <div className="login-orb orb-two"></div>

                <div className="login-orb orb-three"></div>

                <div className="login-grid"></div>

            </div>

            {/* =====================================
                LOGIN CONTAINER
            ====================================== */}

            <main className="login-container">

                {/* =================================
                    LOGIN CARD
                ================================== */}

                <section className="login-card">

                    {/* =================================
                        HEADER
                    ================================== */}

                    <div className="login-card-header">

                        <div className="mobile-login-logo">
                            🌱
                        </div>

                        <h2 className="login-card-label">
                            ADMIN PORTAL
                        </h2>

                    </div>

                    {/* =================================
                        ERROR
                    ================================== */}

                    {error && (
                        <div className="login-error">

                            <span>
                                ⚠
                            </span>

                            {error}

                        </div>
                    )}

                    {/* =================================
                        FORM
                    ================================== */}

                    <form
                        onSubmit={handleSubmit}
                    >

                        {/* =============================
                            EMAIL
                        ============================== */}

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
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    autoComplete="email"
                                />

                            </div>

                        </div>

                        {/* =============================
                            PASSWORD
                        ============================== */}

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
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
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
                                    {showPassword
                                        ? "--"
                                        : "👁"}
                                </button>

                            </div>

                        </div>

                        {/* =============================
                            OPTIONS
                        ============================== */}

                        <div className="login-options">

                            <label className="remember-option">

                                <input
                                    type="checkbox"
                                    checked={
                                        rememberMe
                                    }
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

                        {/* =============================
                            LOGIN BUTTON
                        ============================== */}

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

                    {/* =================================
                        DIVIDER
                    ================================== */}

                    <div className="login-divider">

                        <span>
                            SECURE ACCESS
                        </span>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Login;
