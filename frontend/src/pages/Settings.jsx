import { useState } from "react";

import Sidebar from "../components/Navbar";

import "../css/settings.css";

function Settings() {

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        systemSounds: false,
        autoRefresh: true,
        maintenanceMode: false
    });

    const handleToggle = (key) => {
        setSettings((prev) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        alert("Settings saved successfully.");
    };

    return (
        <div className="settings-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="settings-main">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <header className="settings-header">

                    <div className="settings-header-left">

                        <button
                            className="settings-menu-button"
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>

                        <div>

                            <div className="settings-breadcrumb">
                                HYDROCONTROL / SYSTEM
                            </div>

                            <h1>Settings</h1>

                        </div>

                    </div>

                    <div className="settings-header-status">
                        <span></span>
                        SYSTEM ONLINE
                    </div>

                </header>


                {/* =====================================================
                    SETTINGS CONTENT
                ====================================================== */}

                <section className="settings-grid">

                    {/* =================================================
                        GENERAL SETTINGS
                    ================================================== */}

                    <div className="settings-panel">

                        <div className="settings-panel-header">

                            <div className="settings-title-group">

                                <div className="settings-icon">
                                    ⚙️
                                </div>

                                <div>

                                    <span className="settings-panel-label">
                                        SYSTEM
                                    </span>

                                    <h2>
                                        General Settings
                                    </h2>

                                </div>

                            </div>

                            <span className="settings-badge">
                                ACTIVE
                            </span>

                        </div>


                        <div className="settings-list">

                            {/* Language */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    🌐
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        Language
                                    </strong>

                                    <span>
                                        Select the system interface language.
                                    </span>

                                </div>

                                <select className="settings-select">

                                    <option>English</option>
                                    <option>Filipino</option>

                                </select>

                            </div>


                            {/* Units */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    📏
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        Measurement Units
                                    </strong>

                                    <span>
                                        Choose how sensor values are displayed.
                                    </span>

                                </div>

                                <select className="settings-select">

                                    <option>Metric</option>
                                    <option>Imperial</option>

                                </select>

                            </div>


                            {/* Auto Refresh */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    🔄
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        Automatic Refresh
                                    </strong>

                                    <span>
                                        Automatically update dashboard data.
                                    </span>

                                </div>

                                <button
                                    className={`toggle ${
                                        settings.autoRefresh
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleToggle("autoRefresh")
                                    }
                                >
                                    <span></span>
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        NOTIFICATIONS
                    ================================================== */}

                    <div className="settings-panel">

                        <div className="settings-panel-header">

                            <div className="settings-title-group">

                                <div className="settings-icon">
                                    🔔
                                </div>

                                <div>

                                    <span className="settings-panel-label">
                                        ALERTS
                                    </span>

                                    <h2>
                                        Notifications
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div className="settings-list">

                            {/* Notifications */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    🔔
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        System Notifications
                                    </strong>

                                    <span>
                                        Receive important system alerts.
                                    </span>

                                </div>

                                <button
                                    className={`toggle ${
                                        settings.notifications
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleToggle("notifications")
                                    }
                                >
                                    <span></span>
                                </button>

                            </div>


                            {/* Email */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    ✉️
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        Email Alerts
                                    </strong>

                                    <span>
                                        Send critical alerts to your email.
                                    </span>

                                </div>

                                <button
                                    className={`toggle ${
                                        settings.emailAlerts
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleToggle("emailAlerts")
                                    }
                                >
                                    <span></span>
                                </button>

                            </div>


                            {/* Sounds */}

                            <div className="setting-item">

                                <div className="setting-item-icon">
                                    🔊
                                </div>

                                <div className="setting-info">

                                    <strong>
                                        System Sounds
                                    </strong>

                                    <span>
                                        Play sounds for system alerts.
                                    </span>

                                </div>

                                <button
                                    className={`toggle ${
                                        settings.systemSounds
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        handleToggle("systemSounds")
                                    }
                                >
                                    <span></span>
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        CONTROLLER
                    ================================================== */}

                    <div className="settings-panel">

                        <div className="settings-panel-header">

                            <div className="settings-title-group">

                                <div className="settings-icon">
                                    📡
                                </div>

                                <div>

                                    <span className="settings-panel-label">
                                        HARDWARE
                                    </span>

                                    <h2>
                                        Controller Settings
                                    </h2>

                                </div>

                            </div>

                            <div className="controller-status">
                                <span></span>
                                ESP32 ONLINE
                            </div>

                        </div>


                        <div className="controller-card">

                            <div className="controller-logo">
                                📡
                            </div>

                            <div className="controller-info">

                                <strong>
                                    HydroControl ESP32
                                </strong>

                                <span>
                                    Main system controller
                                </span>

                                <small>
                                    Device ID: ESP32-HC-001
                                </small>

                            </div>

                            <div className="controller-online">
                                <i></i>
                                Connected
                            </div>

                        </div>


                        <div className="hardware-stats">

                            <div>

                                <span>
                                    CONNECTION
                                </span>

                                <strong>
                                    Wi-Fi
                                </strong>

                            </div>

                            <div>

                                <span>
                                    SIGNAL
                                </span>

                                <strong>
                                    -42 dBm
                                </strong>

                            </div>

                            <div>

                                <span>
                                    UPTIME
                                </span>

                                <strong>
                                    14h 28m
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        MAINTENANCE
                    ================================================== */}

                    <div className="settings-panel">

                        <div className="settings-panel-header">

                            <div className="settings-title-group">

                                <div className="settings-icon warning">
                                    🛠️
                                </div>

                                <div>

                                    <span className="settings-panel-label">
                                        MAINTENANCE
                                    </span>

                                    <h2>
                                        System Maintenance
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div className="maintenance-warning">

                            <div className="warning-icon">
                                ⚠️
                            </div>

                            <div>

                                <strong>
                                    Maintenance Mode
                                </strong>

                                <span>
                                    Temporarily disable automatic
                                    controls while performing maintenance.
                                </span>

                            </div>

                            <button
                                className={`toggle ${
                                    settings.maintenanceMode
                                        ? "active warning-toggle"
                                        : ""
                                }`}
                                onClick={() =>
                                    handleToggle("maintenanceMode")
                                }
                            >
                                <span></span>
                            </button>

                        </div>


                        <div className="maintenance-actions">

                            <button className="secondary-button">
                                ↻ Restart Controller
                            </button>

                            <button className="secondary-button">
                                🧹 Clear Cache
                            </button>

                            <button className="danger-button">
                                ⚠ Reset System
                            </button>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SYSTEM INFORMATION
                ====================================================== */}

                <section className="settings-panel system-info-panel">

                    <div className="settings-panel-header">

                        <div>

                            <span className="settings-panel-label">
                                INFORMATION
                            </span>

                            <h2>
                                System Information
                            </h2>

                        </div>

                    </div>


                    <div className="system-info-grid">

                        <div className="info-box">

                            <span>
                                SOFTWARE VERSION
                            </span>

                            <strong>
                                v1.0.0
                            </strong>

                        </div>

                        <div className="info-box">

                            <span>
                                FIRMWARE
                            </span>

                            <strong>
                                ESP32 v2.4
                            </strong>

                        </div>

                        <div className="info-box">

                            <span>
                                DATABASE
                            </span>

                            <strong>
                                Connected
                            </strong>

                        </div>

                        <div className="info-box">

                            <span>
                                LAST UPDATE
                            </span>

                            <strong>
                                Aug 21, 2026
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SAVE BAR
                ====================================================== */}

                <div className="settings-save-bar">

                    <div>

                        <span className="save-dot"></span>

                        <span>
                            Configuration changes are ready to save.
                        </span>

                    </div>

                    <div className="save-actions">

                        <button className="cancel-button">
                            Cancel
                        </button>

                        <button
                            className="save-button"
                            onClick={handleSave}
                        >
                            ✓ Save Settings
                        </button>

                    </div>

                </div>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <footer className="settings-footer">

                    <span>
                        © 2026 HydroControl
                    </span>

                    <span>
                        System Configuration • ESP32
                    </span>

                    <span>
                        System Status: Online
                    </span>

                </footer>

            </main>

        </div>
    );
}

export default Settings;