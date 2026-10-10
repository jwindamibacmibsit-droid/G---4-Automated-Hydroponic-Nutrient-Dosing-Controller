import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Droplets,
    ClipboardList,
    Settings,
    Info,
    LogOut,
    Leaf,
    X,
} from "lucide-react";

import "../css/navbar.css";

function Navbar({ isOpen, setIsOpen }) {
    const navigate = useNavigate();

    const menuItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Pump Control",
            path: "/pump-control",
            icon: Droplets,
        },
        {
            name: "System Logs",
            path: "/logs",
            icon: ClipboardList,
        },
    ];

    const handleLogout = () => {
        localStorage.removeItem("hydrocontrol_user");
        sessionStorage.removeItem("hydrocontrol_user");

        if (setIsOpen) {
            setIsOpen(false);
        }

        navigate("/", { replace: true });
    };

    const closeSidebar = () => {
        if (setIsOpen) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`sidebar ${
                    isOpen ? "sidebar-open" : ""
                }`}
            >
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <Leaf size={25} strokeWidth={2} />
                    </div>

                    <div className="sidebar-logo-text">
                        <h2>HydroControl</h2>
                        <span>ESP32 SYSTEM</span>
                    </div>

                    <button
                        type="button"
                        className="sidebar-close"
                        onClick={closeSidebar}
                        aria-label="Close sidebar"
                    >
                        <X size={21} />
                    </button>
                </div>

                {/* Main Navigation */}
                <div className="sidebar-section-title">
                    MAIN MENU
                </div>

                <nav className="sidebar-menu">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar-link ${
                                        isActive ? "active" : ""
                                    }`
                                }
                                onClick={closeSidebar}
                            >
                                <span className="sidebar-icon">
                                    <Icon
                                        size={20}
                                        strokeWidth={1.8}
                                    />
                                </span>

                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* System Navigation */}
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
                        onClick={closeSidebar}
                    >
                        <span className="sidebar-icon">
                            <Settings
                                size={20}
                                strokeWidth={1.8}
                            />
                        </span>

                        <span>Settings</span>
                    </NavLink>

                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            `sidebar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                        onClick={closeSidebar}
                    >
                        <span className="sidebar-icon">
                            <Info
                                size={20}
                                strokeWidth={1.8}
                            />
                        </span>

                        <span>About System</span>
                    </NavLink>

                    {/* Logout */}
                    <button
                        type="button"
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        <span className="sidebar-icon">
                            <LogOut
                                size={20}
                                strokeWidth={1.8}
                            />
                        </span>

                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default Navbar;