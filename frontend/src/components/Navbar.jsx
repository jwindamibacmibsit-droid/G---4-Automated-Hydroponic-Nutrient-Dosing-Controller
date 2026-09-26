import { NavLink, useNavigate } from "react-router-dom";
import "../css/navbar.css";

function Navbar({ isOpen, setIsOpen }) {
    const navigate = useNavigate();

    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: "⌂"
        },
        {
            name: "Pump Control",
            path: "/pump-control",
            icon: "⚙️"
        },
        {
            name: "System Logs",
            path: "/logs",
            icon: "📋"
        }
    ];

    // =====================================================
    // LOGOUT
    // =====================================================
    const handleLogout = () => {
        // Remove saved login information
        localStorage.removeItem("hydrocontrol_user");
        sessionStorage.removeItem("hydrocontrol_user");

        // Close sidebar
        if (setIsOpen) {
            setIsOpen(false);
        }

        // Redirect to login page
        navigate("/", {
            replace: true
        });
    };

    return (
        <>
            {/* =================================================
                OVERLAY
            ================================================== */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================== */}
            <aside
                className={`sidebar ${
                    isOpen ? "sidebar-open" : ""
                }`}
            >
                {/* =================================================
                    LOGO
                ================================================== */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        🌱
                    </div>

                    <div className="sidebar-logo-text">
                        <h2>HydroControl</h2>
                        <span>ESP32 SYSTEM</span>
                    </div>

                    <button
                        className="sidebar-close"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close sidebar"
                    >
                        ×
                    </button>
                </div>

                {/* =================================================
                    NAVIGATION
                ================================================== */}
                <div className="sidebar-section-title">
                    MAIN MENU
                </div>

                <nav className="sidebar-menu">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `sidebar-link ${
                                    isActive ? "active" : ""
                                }`
                            }
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="sidebar-icon">
                                {item.icon}
                            </span>

                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* =================================================
                    SYSTEM
                ================================================== */}
                <div className="sidebar-bottom">
                    <div className="sidebar-section-title">
                        SYSTEM
                    </div>

                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="sidebar-icon">
                            ⚙
                        </span>

                        Settings
                    </NavLink>

                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            `sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="sidebar-icon">
                            ⓘ
                        </span>

                        About System
                    </NavLink>

                    {/* =================================================
                        LOGOUT
                    ================================================== */}
                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span className="sidebar-icon">
                            ↪
                        </span>

                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Navbar;