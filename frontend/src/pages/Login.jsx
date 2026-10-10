import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/login.css";

const API_URL = import.meta.env.VITE_API_URL;

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

        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !formData.email ||
            !formData.password
        ) {
            setError(
                "Please enter your email and password."
            );

            return;
        }

        setError("");
        setLoading(true);

        try {
            console.log(
                "API URL:",
                API_URL
            );

            // ==========================================
            // SEND LOGIN REQUEST
            // ==========================================

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password
                    })
                }
            );

            console.log(
                "HTTP STATUS:",
                response.status
            );

            console.log(
                "STATUS TEXT:",
                response.statusText
            );

            // ==========================================
            // READ RESPONSE
            // ==========================================

            const responseText =
                await response.text();

            if (!responseText.trim()) {
                throw new Error(
                    `Server returned an empty response. HTTP ${response.status}`
                );
            }

            let data;

            try {
                data = JSON.parse(
                    responseText
                );
            } catch (jsonError) {
                console.error(
                    "INVALID JSON RESPONSE:",
                    responseText
                );

                throw new Error(
                    `Server returned invalid JSON. HTTP ${response.status}`
                );
            }

            console.log(
                "LOGIN RESPONSE:",
                data
            );

            // ==========================================
            // LOGIN FAILED
            // ==========================================

            if (
                !response.ok ||
                !data.success
            ) {
                setError(
                    data.message ||
                    "Invalid email or password."
                );

                return;
            }

            // ==========================================
            // GET USER
            // ==========================================

            const user = data.user;

            console.log(
                "LOGGED IN USER:",
                user
            );

            console.log(
                "PREVIOUS LAST LOGIN:",
                user.last_login
            );

            // ==========================================
            // UPDATE APP USER
            // ==========================================

            if (onLogin) {
                onLogin(user);
            }

            // ==========================================
            // STORE USER
            // ==========================================

            if (rememberMe) {
                localStorage.setItem(
                    "hydrocontrol_user",
                    JSON.stringify(user)
                );

                // Remove session copy if it exists
                sessionStorage.removeItem(
                    "hydrocontrol_user"
                );
            } else {
                sessionStorage.setItem(
                    "hydrocontrol_user",
                    JSON.stringify(user)
                );

                // Remove local copy if it exists
                localStorage.removeItem(
                    "hydrocontrol_user"
                );
            }

            // ==========================================
            // GO TO DASHBOARD
            // ==========================================

            navigate("/dashboard");

        } catch (error) {
            console.error(
                "LOGIN FETCH ERROR:",
                error
            );

            setError(
                `Unable to connect to the HydroControl server: ${error.message}`
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

                    <div class="login-card-header">

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
