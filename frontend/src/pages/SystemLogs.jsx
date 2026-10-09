
import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import Sidebar from "../components/Navbar";
import "../css/system_logs.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const LOGS_URL = `${API_URL}/api/system/logs`;

const LEVELS = ["INFO", "SUCCESS", "WARNING", "ERROR"];

const normalizeLevel = (value) =>
    String(value || "INFO").toUpperCase();

const formatDateTime = (value) => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

const formatTime = (value) => {
    if (!value) return "--";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
};

function SystemLogs() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [apiOnline, setApiOnline] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [lastLogin, setLastLogin] = useState(null);
    const [availableLevels, setAvailableLevels] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const loadCurrentUser = useCallback(() => {
        try {
            const storedUser =
                localStorage.getItem("hydrocontrol_user") ||
                sessionStorage.getItem("hydrocontrol_user");

            if (!storedUser) {
                setLastLogin(null);
                return;
            }

            const user = JSON.parse(storedUser);
            setLastLogin(user.last_login || null);
        } catch (error) {
            console.error("Could not read current user:", error);
            setLastLogin(null);
        }
    }, []);

    const fetchLogs = useCallback(async ({ silent = false } = {}) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const response = await fetch(
                `${LOGS_URL}?limit=500`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json"
                    },
                    cache: "no-store"
                }
            );

            const text = await response.text();

            if (!text.trim()) {
                throw new Error(
                    `The server returned an empty response (${response.status}).`
                );
            }

            let result;

            try {
                result = JSON.parse(text);
            } catch {
                throw new Error("The server returned invalid JSON.");
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || `Request failed (${response.status}).`
                );
            }

            const receivedLogs = Array.isArray(result.data)
                ? result.data
                : [];

            setLogs(receivedLogs);

            setAvailableLevels(
                Array.isArray(result.filters?.levels)
                    ? result.filters.levels
                    : []
            );

            setAvailableCategories(
                Array.isArray(result.filters?.categories)
                    ? result.filters.categories
                    : []
            );

            setApiOnline(true);
            setLastUpdated(new Date());
            setError("");
        } catch (err) {
            console.error("Failed to fetch system logs:", err);

            setApiOnline(false);
            setError(
                err.message || "Unable to connect to the system logs API."
            );

            // Keep previously loaded records visible on refresh failure.
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadCurrentUser();
        fetchLogs();

        const intervalId = window.setInterval(() => {
            fetchLogs({ silent: true });
        }, 30000);

        return () => window.clearInterval(intervalId);
    }, [fetchLogs, loadCurrentUser]);

    const filteredLogs = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return logs.filter((log) => {
            const searchableFields = [
                log.event,
                log.details,
                log.category,
                log.level,
                log.device,
                log.device_uid,
                log.user_email,
                log.device_id
            ];

            const matchesSearch =
                !search ||
                searchableFields.some((field) =>
                    String(field ?? "").toLowerCase().includes(search)
                );

            const matchesLevel =
                severityFilter === "All" ||
                normalizeLevel(log.level) === severityFilter;

            const matchesCategory =
                categoryFilter === "All" ||
                String(log.category || "SYSTEM").toUpperCase() ===
                    categoryFilter.toUpperCase();

            return matchesSearch && matchesLevel && matchesCategory;
        });
    }, [logs, searchTerm, severityFilter, categoryFilter]);

    const statistics = useMemo(() => {
        const result = {
            total: logs.length,
            SUCCESS: 0,
            WARNING: 0,
            ERROR: 0,
            INFO: 0
        };

        logs.forEach((log) => {
            const level = normalizeLevel(log.level);

            if (Object.prototype.hasOwnProperty.call(result, level)) {
                result[level] += 1;
            } else {
                result.INFO += 1;
            }
        });

        return result;
    }, [logs]);

    const latestEvent = logs.length
        ? logs.reduce((latest, current) => {
            if (!latest) return current;

            return new Date(current.timestamp || 0) >
                new Date(latest.timestamp || 0)
                ? current
                : latest;
        }, null)
        : null;

    const handleRefresh = () => {
        loadCurrentUser();
        fetchLogs();
    };

    const exportCSV = () => {
        if (!filteredLogs.length) return;

        const columns = [
            ["Timestamp", "timestamp"],
            ["Level", "level"],
            ["Category", "category"],
            ["Event", "event"],
            ["Device", "device"],
            ["Device UID", "device_uid"],
            ["User Email", "user_email"],
            ["Details", "details"]
        ];

        const escapeCSV = (value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        };

        const csv = [
            columns.map(([label]) => escapeCSV(label)).join(","),
            ...filteredLogs.map((log) =>
                columns
                    .map(([, key]) => escapeCSV(log[key]))
                    .join(",")
            )
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csv], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = `hydrocontrol-system-logs-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSeverityFilter("All");
        setCategoryFilter("All");
    };

    return (
        <div className="logs-page">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="logs-main">
                <header className="logs-header">
                    <div className="logs-heading">
                        <button
                            className="logs-menu-button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                        >
                            ☰
                        </button>

                        <div>
                            <div className="logs-breadcrumb">
                                HYDROCONTROL <span>/</span> MONITORING
                            </div>

                            <h1>System Logs</h1>

                            <p>
                                Review recorded events, user activity,
                                device operations, and system warnings.
                            </p>
                        </div>
                    </div>

                    <div
                        className={`logs-api-status ${
                            apiOnline === true
                                ? "is-online"
                                : apiOnline === false
                                    ? "is-offline"
                                    : "is-unknown"
                        }`}
                        role="status"
                    >
                        <span className="status-dot" />
                        {apiOnline === true
                            ? "API CONNECTED"
                            : apiOnline === false
                                ? "API UNAVAILABLE"
                                : "CHECKING API"}
                    </div>
                </header>

                {error && (
                    <div className="logs-alert" role="alert">
                        <span className="logs-alert-icon">!</span>

                        <div>
                            <strong>Could not refresh logs</strong>
                            <p>{error}</p>
                            {logs.length > 0 && (
                                <small>
                                    Showing previously loaded records.
                                </small>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={loading || refreshing}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="logs-stats">
                    <article className="logs-stat-card">
                        <div className="logs-stat-top">
                            <span className="logs-stat-icon">≡</span>
                            <span className="logs-stat-label">
                                TOTAL RECORDS
                            </span>
                        </div>

                        <strong className="logs-stat-value">
                            {statistics.total.toLocaleString()}
                        </strong>

                        <span className="logs-stat-note">
                            Records loaded from the database
                        </span>
                    </article>

                    <article className="logs-stat-card">
                        <div className="logs-stat-top">
                            <span className="logs-stat-icon success">✓</span>
                            <span className="logs-stat-label">
                                SUCCESS
                            </span>
                        </div>

                        <strong className="logs-stat-value">
                            {statistics.SUCCESS.toLocaleString()}
                        </strong>

                        <span className="logs-stat-note">
                            Successful operations
                        </span>
                    </article>

                    <article className="logs-stat-card">
                        <div className="logs-stat-top">
                            <span className="logs-stat-icon warning">!</span>
                            <span className="logs-stat-label">
                                WARNINGS
                            </span>
                        </div>

                        <strong className="logs-stat-value">
                            {statistics.WARNING.toLocaleString()}
                        </strong>

                        <span className="logs-stat-note">
                            Events to review
                        </span>
                    </article>

                    <article className="logs-stat-card">
                        <div className="logs-stat-top">
                            <span className="logs-stat-icon danger">×</span>
                            <span className="logs-stat-label">
                                ERRORS
                            </span>
                        </div>

                        <strong className="logs-stat-value">
                            {statistics.ERROR.toLocaleString()}
                        </strong>

                        <span className="logs-stat-note">
                            Failed or problematic events
                        </span>
                    </article>
                </section>

                <section className="logs-content">
                    <aside className="logs-panel logs-info-panel">
                        <div className="logs-panel-heading">
                            <div>
                                <span className="logs-eyebrow">
                                    OVERVIEW
                                </span>
                                <h2>Log Information</h2>
                            </div>

                            <span className="logs-panel-icon">◷</span>
                        </div>

                        <div className="logs-info-list">
                            <div className="logs-info-row">
                                <span>API status</span>
                                <strong>
                                    {apiOnline === true
                                        ? "Connected"
                                        : apiOnline === false
                                            ? "Unavailable"
                                            : "Checking"}
                                </strong>
                            </div>

                            <div className="logs-info-row">
                                <span>Loaded records</span>
                                <strong>{logs.length}</strong>
                            </div>

                            <div className="logs-info-row">
                                <span>Last login</span>
                                <strong>
                                    {lastLogin
                                        ? formatDateTime(lastLogin)
                                        : "Not available"}
                                </strong>
                            </div>

                            <div className="logs-info-row">
                                <span>Last log event</span>
                                <strong>
                                    {latestEvent
                                        ? formatDateTime(latestEvent.timestamp)
                                        : "No events"}
                                </strong>
                            </div>

                            <div className="logs-info-row">
                                <span>Last successful refresh</span>
                                <strong>
                                    {lastUpdated
                                        ? formatTime(lastUpdated)
                                        : "--"}
                                </strong>
                            </div>
                        </div>

                        <div className="logs-info-footnote">
                            API connectivity does not confirm that the
                            ESP32 controller itself is online.
                        </div>
                    </aside>

                    <section className="logs-panel logs-events-panel">
                        <div className="logs-panel-heading logs-events-heading">
                            <div>
                                <span className="logs-eyebrow">
                                    AUDIT TRAIL
                                </span>
                                <h2>Event History</h2>
                                <p>
                                    Search, filter, and export recorded activity.
                                </p>
                            </div>

                            <div className="logs-actions">
                                <button
                                    className="logs-button logs-button-secondary"
                                    type="button"
                                    onClick={exportCSV}
                                    disabled={!filteredLogs.length}
                                >
                                    ↓ Export CSV
                                </button>

                                <button
                                    className="logs-button logs-button-primary"
                                    type="button"
                                    onClick={handleRefresh}
                                    disabled={loading || refreshing}
                                >
                                    <span
                                        className={refreshing ? "logs-spin" : ""}
                                    >
                                        ↻
                                    </span>
                                    {refreshing ? "Refreshing" : "Refresh"}
                                </button>
                            </div>
                        </div>

                        <div className="logs-toolbar">
                            <label className="logs-search">
                                <span aria-hidden="true">⌕</span>
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search events, device, user..."
                                    aria-label="Search system logs"
                                />
                            </label>

                            <select
                                value={severityFilter}
                                onChange={(event) =>
                                    setSeverityFilter(event.target.value)
                                }
                                aria-label="Filter by severity"
                            >
                                <option value="All">All levels</option>
                                {[...new Set([
                                    ...LEVELS,
                                    ...availableLevels.map(normalizeLevel)
                                ])].map((level) => (
                                    <option key={level} value={level}>
                                        {level}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(event) =>
                                    setCategoryFilter(event.target.value)
                                }
                                aria-label="Filter by category"
                            >
                                <option value="All">All categories</option>
                                {availableCategories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>

                            {(searchTerm ||
                                severityFilter !== "All" ||
                                categoryFilter !== "All") && (
                                <button
                                    className="logs-clear-button"
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>

                        <div className="logs-results-summary">
                            <span>
                                <strong>{filteredLogs.length}</strong>
                                {" "}matching events
                            </span>
                            <span>Newest events first</span>
                        </div>

                        <div className="logs-table-wrapper">
                            <table className="logs-table">
                                <thead>
                                    <tr>
                                        <th>TIME</th>
                                        <th>LEVEL</th>
                                        <th>CATEGORY</th>
                                        <th>EVENT / DETAILS</th>
                                        <th>DEVICE</th>
                                        <th>USER</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading && logs.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="logs-table-message">
                                                <span className="logs-loader" />
                                                Loading system logs...
                                            </td>
                                        </tr>
                                    )}

                                    {!loading && logs.length === 0 && !error && (
                                        <tr>
                                            <td colSpan={6} className="logs-table-message">
                                                <div className="logs-empty-icon">≡</div>
                                                <strong>No system events yet</strong>
                                                <span>
                                                    New records will appear here
                                                    when your backend writes them.
                                                </span>
                                            </td>
                                        </tr>
                                    )}

                                    {filteredLogs.map((log) => {
                                        const level = normalizeLevel(log.level);

                                        return (
                                            <tr key={log.id}>
                                                <td>
                                                    <div className="logs-time-cell">
                                                        <strong>
                                                            {formatTime(log.timestamp)}
                                                        </strong>
                                                        <span>
                                                            {log.timestamp
                                                                ? new Date(log.timestamp)
                                                                    .toLocaleDateString()
                                                                : "--"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span
                                                        className={`log-level ${level.toLowerCase()}`}
                                                    >
                                                        <i>
                                                            {level === "SUCCESS"
                                                                ? "✓"
                                                                : level === "WARNING"
                                                                    ? "!"
                                                                    : level === "ERROR"
                                                                        ? "×"
                                                                        : "i"}
                                                        </i>
                                                        {level}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="log-category">
                                                        {log.category || "SYSTEM"}
                                                    </span>
                                                </td>

                                                <td className="logs-event-cell">
                                                    <strong>
                                                        {log.event || "Unknown event"}
                                                    </strong>
                                                    <p>
                                                        {log.details || "No additional details"}
                                                    </p>
                                                </td>

                                                <td>
                                                    <div className="logs-device-cell">
                                                        <strong>
                                                            {log.device || "System"}
                                                        </strong>
                                                        {log.device_uid && (
                                                            <span>{log.device_uid}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="logs-user-cell">
                                                    {log.user_email || "System"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {!loading &&
                                filteredLogs.length === 0 &&
                                logs.length > 0 && (
                                    <div className="logs-filter-empty">
                                        <strong>No matching events</strong>
                                        <span>
                                            Try another search or clear your filters.
                                        </span>
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                        >
                                            Clear filters
                                        </button>
                                    </div>
                                )}
                        </div>

                        <footer className="logs-table-footer">
                            <span>
                                Displaying {filteredLogs.length} of {logs.length} loaded records
                            </span>

                            <span>
                                {refreshing
                                    ? "Updating…"
                                    : lastUpdated
                                        ? `Updated ${formatTime(lastUpdated)}`
                                        : "Not yet updated"}
                            </span>
                        </footer>
                    </section>
                </section>

                <footer className="logs-footer">
                    <span>© 2026 HydroControl</span>
                    <span>System Audit &amp; Event Monitoring</span>
                    <span>
                        {apiOnline === true
                            ? "API connected"
                            : apiOnline === false
                                ? "API disconnected"
                                : "Checking connection"}
                    </span>
                </footer>
            </main>
        </div>
    );
}

export default SystemLogs;
