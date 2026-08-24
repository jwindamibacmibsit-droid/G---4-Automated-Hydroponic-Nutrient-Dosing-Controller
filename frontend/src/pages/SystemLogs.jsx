import { useMemo, useState } from "react";

import Sidebar from "../components/Navbar";

import "../css/system-logs.css";

function SystemLogs() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const logs = [
        {
            id: 1,
            time: "03:28:42 AM",
            date: "Aug 21, 2026",
            level: "INFO",
            category: "SYSTEM",
            event: "System heartbeat received",
            device: "ESP32 Controller",
            details: "Controller is operating normally."
        },
        {
            id: 2,
            time: "03:27:15 AM",
            date: "Aug 21, 2026",
            level: "SUCCESS",
            category: "PUMP",
            event: "Nutrient pump activated",
            device: "Pump A",
            details: "Pump activated for scheduled nutrient cycle."
        },
        {
            id: 3,
            time: "03:25:08 AM",
            date: "Aug 21, 2026",
            level: "INFO",
            category: "WATER",
            event: "Water level reading updated",
            device: "Water Sensor",
            details: "Reservoir level measured at 78%."
        },
        {
            id: 4,
            time: "03:24:36 AM",
            date: "Aug 21, 2026",
            level: "SUCCESS",
            category: "PH",
            event: "pH adjustment completed",
            device: "pH Controller",
            details: "pH level stabilized at 6.2."
        },
        {
            id: 5,
            time: "03:22:51 AM",
            date: "Aug 21, 2026",
            level: "WARNING",
            category: "NUTRIENT",
            event: "EC level approaching threshold",
            device: "EC Sensor",
            details: "EC level reached 1.85 mS/cm."
        },
        {
            id: 6,
            time: "03:20:14 AM",
            date: "Aug 21, 2026",
            level: "INFO",
            category: "TEMPERATURE",
            event: "Temperature reading updated",
            device: "Temperature Sensor",
            details: "Water temperature measured at 24.7°C."
        },
        {
            id: 7,
            time: "03:18:03 AM",
            date: "Aug 21, 2026",
            level: "SUCCESS",
            category: "PUMP",
            event: "Water circulation started",
            device: "Circulation Pump",
            details: "Water circulation operating at 2.4 L/min."
        },
        {
            id: 8,
            time: "03:15:47 AM",
            date: "Aug 21, 2026",
            level: "ERROR",
            category: "SENSOR",
            event: "Sensor response delayed",
            device: "EC Sensor",
            details: "Sensor response exceeded expected interval."
        },
        {
            id: 9,
            time: "03:12:29 AM",
            date: "Aug 21, 2026",
            level: "INFO",
            category: "NETWORK",
            event: "Wi-Fi connection verified",
            device: "ESP32 Controller",
            details: "Network connection is stable."
        },
        {
            id: 10,
            time: "03:10:11 AM",
            date: "Aug 21, 2026",
            level: "SUCCESS",
            category: "SYSTEM",
            event: "Automatic system check completed",
            device: "HydroControl",
            details: "All primary components passed inspection."
        }
    ];

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSeverity =
                severityFilter === "All" ||
                log.level === severityFilter;

            const matchesCategory =
                categoryFilter === "All" ||
                log.category === categoryFilter;

            return (
                matchesSearch &&
                matchesSeverity &&
                matchesCategory
            );
        });
    }, [searchTerm, severityFilter, categoryFilter]);

    const getLevelIcon = (level) => {
        switch (level) {
            case "SUCCESS":
                return "✓";
            case "WARNING":
                return "!";
            case "ERROR":
                return "×";
            default:
                return "i";
        }
    };

    return (
        <div className="logs-page">

            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="logs-main">

                {/* =====================================================
                    HEADER
                ===================================================== */}

                <header className="logs-header">

                    <div className="logs-header-left">

                        <button
                            className="logs-menu-button"
                            onClick={() => setSidebarOpen(true)}
                        >
                            ☰
                        </button>

                        <div>

                            <div className="logs-breadcrumb">
                                HYDROCONTROL / SYSTEM
                            </div>

                            <h1>System Logs</h1>

                            <p>
                                Monitor system events, hardware activity,
                                warnings, and controller operations.
                            </p>

                        </div>

                    </div>

                    <div className="logs-header-status">

                        <span></span>

                        SYSTEM ONLINE

                    </div>

                </header>


                {/* =====================================================
                    SUMMARY CARDS
                ===================================================== */}

                <section className="logs-stats">

                    <div className="logs-stat-card">

                        <div className="logs-stat-header">

                            <div className="logs-stat-icon">
                                ◉
                            </div>

                            <span className="logs-stat-label">
                                TOTAL LOGS
                            </span>

                        </div>

                        <div className="logs-stat-value">
                            1,248
                        </div>

                        <div className="logs-stat-footer">
                            <span>Recorded today</span>
                            <strong>+24</strong>
                        </div>

                    </div>


                    <div className="logs-stat-card">

                        <div className="logs-stat-header">

                            <div className="logs-stat-icon success-icon">
                                ✓
                            </div>

                            <span className="logs-stat-label">
                                SUCCESS EVENTS
                            </span>

                        </div>

                        <div className="logs-stat-value">
                            1,184
                        </div>

                        <div className="logs-stat-footer">
                            <span>System operations</span>
                            <strong>94.9%</strong>
                        </div>

                    </div>


                    <div className="logs-stat-card">

                        <div className="logs-stat-header">

                            <div className="logs-stat-icon warning-icon">
                                !
                            </div>

                            <span className="logs-stat-label">
                                WARNINGS
                            </span>

                        </div>

                        <div className="logs-stat-value warning-value">
                            57
                        </div>

                        <div className="logs-stat-footer">
                            <span>Needs attention</span>
                            <strong>4.6%</strong>
                        </div>

                    </div>


                    <div className="logs-stat-card">

                        <div className="logs-stat-header">

                            <div className="logs-stat-icon error-icon">
                                ×
                            </div>

                            <span className="logs-stat-label">
                                ERRORS
                            </span>

                        </div>

                        <div className="logs-stat-value error-value">
                            7
                        </div>

                        <div className="logs-stat-footer">
                            <span>Requires review</span>
                            <strong>0.5%</strong>
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SYSTEM HEALTH
                ===================================================== */}

                <section className="logs-content">

                    <div className="logs-panel health-panel">

                        <div className="logs-panel-header">

                            <div>

                                <span className="logs-panel-label">
                                    SYSTEM STATUS
                                </span>

                                <h2>
                                    Controller Health
                                </h2>

                            </div>

                            <div className="health-badge">

                                <span></span>

                                HEALTHY

                            </div>

                        </div>


                        <div className="health-grid">

                            <div className="health-item">

                                <div className="health-icon">
                                    📡
                                </div>

                                <div>
                                    <span>ESP32 Controller</span>
                                    <strong>Online</strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    📶
                                </div>

                                <div>
                                    <span>Network</span>
                                    <strong>Connected</strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    💾
                                </div>

                                <div>
                                    <span>Database</span>
                                    <strong>Operational</strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    ⚡
                                </div>

                                <div>
                                    <span>Power System</span>
                                    <strong>Stable</strong>
                                </div>

                                <i></i>

                            </div>

                        </div>

                    </div>


                    {/* SYSTEM INFORMATION */}

                    <div className="logs-panel system-info-panel">

                        <div className="logs-panel-header">

                            <div>

                                <span className="logs-panel-label">
                                    CONTROLLER
                                </span>

                                <h2>
                                    System Information
                                </h2>

                            </div>

                        </div>


                        <div className="system-info-list">

                            <div>
                                <span>Controller</span>
                                <strong>ESP32-WROOM-32</strong>
                            </div>

                            <div>
                                <span>Firmware</span>
                                <strong>v2.4.1</strong>
                            </div>

                            <div>
                                <span>Uptime</span>
                                <strong>14d 07h 32m</strong>
                            </div>

                            <div>
                                <span>Last Restart</span>
                                <strong>Aug 06, 2026</strong>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    LOG TABLE
                ===================================================== */}

                <section className="logs-panel log-history-panel">

                    <div className="logs-panel-header">

                        <div>

                            <span className="logs-panel-label">
                                ACTIVITY HISTORY
                            </span>

                            <h2>
                                System Event Logs
                            </h2>

                        </div>

                        <button
                            className="logs-refresh-button"
                            onClick={() => window.location.reload()}
                        >
                            ↻ Refresh
                        </button>

                    </div>


                    {/* FILTERS */}

                    <div className="logs-toolbar">

                        <div className="logs-search">

                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search system logs..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                            />

                        </div>


                        <select
                            value={severityFilter}
                            onChange={(e) =>
                                setSeverityFilter(e.target.value)
                            }
                        >
                            <option value="All">
                                All Severity
                            </option>
                            <option value="INFO">
                                Info
                            </option>
                            <option value="SUCCESS">
                                Success
                            </option>
                            <option value="WARNING">
                                Warning
                            </option>
                            <option value="ERROR">
                                Error
                            </option>
                        </select>


                        <select
                            value={categoryFilter}
                            onChange={(e) =>
                                setCategoryFilter(e.target.value)
                            }
                        >
                            <option value="All">
                                All Categories
                            </option>
                            <option value="SYSTEM">
                                System
                            </option>
                            <option value="PUMP">
                                Pump
                            </option>
                            <option value="WATER">
                                Water
                            </option>
                            <option value="PH">
                                pH
                            </option>
                            <option value="NUTRIENT">
                                Nutrient
                            </option>
                            <option value="TEMPERATURE">
                                Temperature
                            </option>
                            <option value="SENSOR">
                                Sensor
                            </option>
                            <option value="NETWORK">
                                Network
                            </option>
                        </select>

                    </div>


                    {/* TABLE */}

                    <div className="logs-table-wrapper">

                        <table className="logs-table">

                            <thead>

                                <tr>

                                    <th>TIME</th>

                                    <th>LEVEL</th>

                                    <th>CATEGORY</th>

                                    <th>EVENT</th>

                                    <th>DEVICE</th>

                                    <th>DETAILS</th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredLogs.map((log) => (

                                    <tr key={log.id}>

                                        <td>

                                            <div className="log-time">

                                                <strong>
                                                    {log.time}
                                                </strong>

                                                <span>
                                                    {log.date}
                                                </span>

                                            </div>

                                        </td>


                                        <td>

                                            <span
                                                className={`log-level ${log.level.toLowerCase()}`}
                                            >

                                                <i>
                                                    {getLevelIcon(log.level)}
                                                </i>

                                                {log.level}

                                            </span>

                                        </td>


                                        <td>

                                            <span className="log-category">
                                                {log.category}
                                            </span>

                                        </td>


                                        <td>

                                            <strong className="log-event">
                                                {log.event}
                                            </strong>

                                        </td>


                                        <td>

                                            <span className="log-device">
                                                {log.device}
                                            </span>

                                        </td>


                                        <td>

                                            <span className="log-details">
                                                {log.details}
                                            </span>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>


                        {filteredLogs.length === 0 && (

                            <div className="empty-logs">

                                <div>
                                    ⌕
                                </div>

                                <strong>
                                    No logs found
                                </strong>

                                <span>
                                    Try changing your search or filters.
                                </span>

                            </div>

                        )}

                    </div>


                    <div className="logs-table-footer">

                        <span>
                            Showing {filteredLogs.length} of {logs.length} events
                        </span>

                        <span>
                            Last updated: 03:28 AM
                        </span>

                    </div>

                </section>


                {/* =====================================================
                    FOOTER
                ===================================================== */}

                <footer className="logs-footer">

                    <span>
                        © 2026 HydroControl
                    </span>

                    <span>
                        System Logs • ESP32 Controller
                    </span>

                    <span>
                        System Status: Online
                    </span>

                </footer>

            </main>

        </div>
    );
}

export default SystemLogs;