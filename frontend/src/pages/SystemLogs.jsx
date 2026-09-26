import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Navbar";

import "../css/system-logs.css";

const API_URL = "http://localhost:5000/api";

function SystemLogs() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [lastUpdated, setLastUpdated] = useState(null);
    const [lastLogin, setLastLogin] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");


    // =====================================================
    // FETCH SYSTEM LOGS
    // =====================================================

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_URL}/logs`);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Failed to load system logs."
                );
            }

            setLogs(result.data || []);
            setLastUpdated(new Date());

        } catch (error) {
            console.error(
                "Failed to load system logs:",
                error
            );

            setError(
                "Unable to load system logs from the server."
            );

            setLogs([]);

        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // LOAD CURRENT USER / LAST LOGIN
    // =====================================================

    const loadCurrentUser = () => {
        const storedUser =
            localStorage.getItem("hydrocontrol_user") ||
            sessionStorage.getItem("hydrocontrol_user");

        if (!storedUser) {
            setLastLogin(null);
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            setLastLogin(user.last_login || null);

        } catch (error) {
            console.error(
                "Failed to read logged-in user:",
                error
            );

            setLastLogin(null);
        }
    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadCurrentUser();
        fetchLogs();
    }, []);


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatTime = (timestamp) => {
        if (!timestamp) {
            return "--";
        }

        return new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };


    const formatDate = (timestamp) => {
        if (!timestamp) {
            return "--";
        }

        return new Date(timestamp).toLocaleDateString([], {
            year: "numeric",
            month: "short",
            day: "2-digit"
        });
    };


    const formatDateTime = (timestamp) => {
        if (!timestamp) {
            return "--";
        }

        return new Date(timestamp).toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    };


    // =====================================================
    // FILTER SYSTEM LOGS
    // =====================================================

    const filteredLogs = useMemo(() => {
        const search = searchTerm.toLowerCase();

        return logs.filter((log) => {

            const matchesSearch =
                String(log.event || "")
                    .toLowerCase()
                    .includes(search) ||

                String(log.details || "")
                    .toLowerCase()
                    .includes(search) ||

                String(log.category || "")
                    .toLowerCase()
                    .includes(search) ||

                String(log.device || "")
                    .toLowerCase()
                    .includes(search) ||

                String(log.device_id || "")
                    .toLowerCase()
                    .includes(search);


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

    }, [
        logs,
        searchTerm,
        severityFilter,
        categoryFilter
    ]);


    // =====================================================
    // SYSTEM STATISTICS
    // =====================================================

    const totalLogs = logs.length;

    const successLogs = logs.filter(
        (log) => log.level === "SUCCESS"
    ).length;

    const warningLogs = logs.filter(
        (log) => log.level === "WARNING"
    ).length;

    const errorLogs = logs.filter(
        (log) => log.level === "ERROR"
    ).length;


    const successPercentage =
        totalLogs > 0
            ? ((successLogs / totalLogs) * 100).toFixed(1)
            : "0.0";


    const warningPercentage =
        totalLogs > 0
            ? ((warningLogs / totalLogs) * 100).toFixed(1)
            : "0.0";


    const errorPercentage =
        totalLogs > 0
            ? ((errorLogs / totalLogs) * 100).toFixed(1)
            : "0.0";


    // =====================================================
    // LEVEL ICON
    // =====================================================

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


    // =====================================================
    // RENDER
    // =====================================================

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
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                        >
                            ☰
                        </button>


                        <div>

                            <div className="logs-breadcrumb">
                                HYDROCONTROL / SYSTEM
                            </div>

                            <h1>
                                System Logs
                            </h1>

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
                            {totalLogs.toLocaleString()}
                        </div>

                        <div className="logs-stat-footer">

                            <span>
                                Database records
                            </span>

                            <strong>
                                {filteredLogs.length}
                            </strong>

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
                            {successLogs.toLocaleString()}
                        </div>

                        <div className="logs-stat-footer">

                            <span>
                                System operations
                            </span>

                            <strong>
                                {successPercentage}%
                            </strong>

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
                            {warningLogs.toLocaleString()}
                        </div>

                        <div className="logs-stat-footer">

                            <span>
                                Needs attention
                            </span>

                            <strong>
                                {warningPercentage}%
                            </strong>

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
                            {errorLogs.toLocaleString()}
                        </div>

                        <div className="logs-stat-footer">

                            <span>
                                Requires review
                            </span>

                            <strong>
                                {errorPercentage}%
                            </strong>

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
                                    <span>
                                        ESP32 Controller
                                    </span>

                                    <strong>
                                        Online
                                    </strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    📶
                                </div>

                                <div>
                                    <span>
                                        Network
                                    </span>

                                    <strong>
                                        Connected
                                    </strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    💾
                                </div>

                                <div>
                                    <span>
                                        Database
                                    </span>

                                    <strong>
                                        Operational
                                    </strong>
                                </div>

                                <i></i>

                            </div>


                            <div className="health-item">

                                <div className="health-icon">
                                    ⚡
                                </div>

                                <div>
                                    <span>
                                        Power System
                                    </span>

                                    <strong>
                                        Stable
                                    </strong>
                                </div>

                                <i></i>

                            </div>

                        </div>

                    </div>


                    {/* =====================================================
                        SYSTEM INFORMATION
                    ===================================================== */}

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
                                <span>
                                    Controller
                                </span>

                                <strong>
                                    ESP32-WROOM-32
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Firmware
                                </span>

                                <strong>
                                    v2.4.1
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Log Records
                                </span>

                                <strong>
                                    {totalLogs}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    Last Login
                                </span>

                                <strong>
                                    {lastLogin
                                        ? formatDateTime(lastLogin)
                                        : "No login recorded"}
                                </strong>
                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    SYSTEM EVENT LOGS
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
                            onClick={() => {
                                loadCurrentUser();
                                fetchLogs();
                            }}
                            disabled={loading}
                        >
                            ↻{" "}
                            {loading
                                ? "Loading..."
                                : "Refresh"}
                        </button>

                    </div>


                    {/* =================================================
                        FILTERS
                    ================================================= */}

                    <div className="logs-toolbar">

                        <div className="logs-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                type="text"
                                placeholder="Search system logs..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        <select
                            value={severityFilter}
                            onChange={(e) =>
                                setSeverityFilter(
                                    e.target.value
                                )
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
                                setCategoryFilter(
                                    e.target.value
                                )
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


                    {/* =================================================
                        TABLE
                    ================================================= */}

                    <div className="logs-table-wrapper">

                        <table className="logs-table">

                            <thead>

                                <tr>

                                    <th>
                                        TIME
                                    </th>

                                    <th>
                                        LEVEL
                                    </th>

                                    <th>
                                        CATEGORY
                                    </th>

                                    <th>
                                        EVENT
                                    </th>

                                    <th>
                                        DEVICE
                                    </th>

                                    <th>
                                        DETAILS
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {loading && (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="logs-loading"
                                        >
                                            Loading system logs...
                                        </td>

                                    </tr>

                                )}


                                {!loading && error && (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="logs-error"
                                        >
                                            {error}
                                        </td>

                                    </tr>

                                )}


                                {!loading &&
                                    !error &&
                                    filteredLogs.map(
                                        (log) => (

                                            <tr
                                                key={log.id}
                                            >

                                                <td>

                                                    <div className="log-time">

                                                        <strong>
                                                            {formatTime(
                                                                log.timestamp
                                                            )}
                                                        </strong>

                                                        <span>
                                                            {formatDate(
                                                                log.timestamp
                                                            )}
                                                        </span>

                                                    </div>

                                                </td>


                                                <td>

                                                    <span
                                                        className={`log-level ${String(
                                                            log.level || "INFO"
                                                        ).toLowerCase()}`}
                                                    >

                                                        <i>
                                                            {getLevelIcon(
                                                                log.level
                                                            )}
                                                        </i>

                                                        {log.level || "INFO"}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="log-category">
                                                        {log.category ||
                                                            "SYSTEM"}
                                                    </span>

                                                </td>


                                                <td>

                                                    <strong className="log-event">
                                                        {log.event ||
                                                            "Unknown event"}
                                                    </strong>

                                                </td>


                                                <td>

                                                    <span className="log-device">

                                                        {log.device ||
                                                            (log.device_id
                                                                ? `Device #${log.device_id}`
                                                                : "System")}

                                                    </span>

                                                </td>


                                                <td>

                                                    <span className="log-details">

                                                        {log.details ||
                                                            "—"}

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                            </tbody>

                        </table>


                        {!loading &&
                            !error &&
                            filteredLogs.length === 0 && (

                                <div className="empty-logs">

                                    <div>
                                        ⌕
                                    </div>

                                    <strong>
                                        No logs found
                                    </strong>

                                    <span>
                                        Try changing your search
                                        or filters.
                                    </span>

                                </div>

                            )}

                    </div>


                    <div className="logs-table-footer">

                        <span>
                            Showing{" "}
                            {filteredLogs.length}{" "}
                            of{" "}
                            {logs.length} events
                        </span>

                        <span>
                            Last updated:{" "}
                            {lastUpdated
                                ? lastUpdated.toLocaleTimeString(
                                      [],
                                      {
                                          hour: "2-digit",
                                          minute: "2-digit"
                                      }
                                  )
                                : "--"}
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