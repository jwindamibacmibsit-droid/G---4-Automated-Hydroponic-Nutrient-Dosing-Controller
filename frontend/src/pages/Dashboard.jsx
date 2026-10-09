
import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import Sidebar from "../components/Navbar";
import "../css/dashboard.css";

import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const REFRESH_MS = 5000;

const toNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

const validPH = (value) => {
    const number = toNumber(value);

    return number !== null && number >= 0 && number <= 14
        ? number
        : null;
};

const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDateTime = (timestamp) => {
    if (!timestamp) return "Not available";

    const date = new Date(timestamp);

    return Number.isNaN(date.getTime())
        ? "Not available"
        : date.toLocaleString();
};

const getWaterStatus = (value) => {
    if (value === null) return "unavailable";
    if (value < 30) return "warning";
    return "normal";
};

const getPHStatus = (value) => {
    if (value === null) return "unavailable";

    // General hydroponic reference range.
    // Adjust for your crop and nutrient solution.
    return value >= 5.5 && value <= 6.5
        ? "normal"
        : "warning";
};

const statusLabels = {
    normal: "Normal",
    warning: "Check level",
    unavailable: "Unavailable",
    online: "Online",
    offline: "Offline",
    unknown: "Unknown",
};

async function fetchJson(path, signal) {
    const response = await fetch(`${API_URL}${path}`, {
        signal,
        headers: {
            Accept: "application/json",
        },
    });

    let body;

    try {
        body = await response.json();
    } catch {
        throw new Error(
            `Invalid server response (${response.status})`
        );
    }

    if (!response.ok || body?.success === false) {
        throw new Error(
            body?.message || `Request failed (${response.status})`
        );
    }

    return body;
}

function MetricCard({
    icon,
    title,
    value,
    unit,
    status,
    description,
}) {
    return (
        <article className="sensor-card">
            <div className="sensor-card-glow" />

            <div className="sensor-card-top">
                <div className="sensor-icon" aria-hidden="true">
                    {icon}
                </div>

                <span className={`sensor-status ${status}`}>
                    <i />
                    {statusLabels[status] || status}
                </span>
            </div>

            <span className="sensor-title">{title}</span>

            <div className="sensor-value">
                {value}
                <span>{unit}</span>
            </div>

            <p className="sensor-description">{description}</p>
        </article>
    );
}

function ChartEmpty({ message }) {
    return (
        <div className="chart-empty">
            <span aria-hidden="true">⌁</span>
            <p>{message}</p>
            <small>Waiting for sensor readings</small>
        </div>
    );
}

function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [apiOffline, setApiOffline] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const [deviceStatus, setDeviceStatus] = useState("unknown");
    const [deviceLastSeen, setDeviceLastSeen] = useState(null);

    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboardData = useCallback(async (signal) => {
        try {
            const [latestResult, historyResult] = await Promise.all([
                fetchJson("/api/sensors/latest", signal),
                fetchJson("/api/sensors/history?limit=50", signal),
            ]);

            if (!Array.isArray(historyResult.data)) {
                throw new Error("Invalid sensor history response");
            }

            // An empty database is not an API failure.
            setLatest(latestResult.data || null);
            setHistory(historyResult.data);

            setApiOffline(false);
            setErrorMessage("");
            setLastUpdated(new Date());
        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Dashboard data error:", error);

            setApiOffline(true);
            setErrorMessage(
                error.message || "Unable to connect to the backend"
            );
        } finally {
            if (!signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const fetchDeviceStatus = useCallback(async (signal) => {
        try {
            const result = await fetchJson(
                "/api/sensors/device-status",
                signal
            );

            const device = result.device || result.data || {};

            setDeviceStatus(
                device.status ||
                (result.online ? "online" : "offline")
            );

            setDeviceLastSeen(device.last_seen || null);
        } catch (error) {
            if (error.name === "AbortError") return;

            console.error("Device status error:", error);
            setDeviceStatus("unknown");
        }
    }, []);

    useEffect(() => {
        let controller;
        let active = true;
        let timer;

        const refresh = async () => {
            if (!active) return;

            // Cancel a previous refresh if it is still running.
            controller?.abort();
            controller = new AbortController();

            await Promise.all([
                fetchDashboardData(controller.signal),
                fetchDeviceStatus(controller.signal),
            ]);

            if (active) {
                timer = window.setTimeout(refresh, REFRESH_MS);
            }
        };

        refresh();

        return () => {
            active = false;
            controller?.abort();
            window.clearTimeout(timer);
        };
    }, [fetchDashboardData, fetchDeviceStatus]);

    // ----------------------------------------
    // NORMALIZE LATEST DATABASE READING
    // ----------------------------------------
    const values = useMemo(() => {
        const ph = validPH(latest?.ph_value ?? latest?.ph);

        const waterPercentage = toNumber(
            latest?.water_percentage ?? latest?.water_level
        );

        const waterLevelCm = toNumber(latest?.water_level_cm);
        const waterDistanceCm = toNumber(
            latest?.water_distance_cm
        );

        return {
            ph,
            waterPercentage:
                waterPercentage !== null &&
                waterPercentage >= 0 &&
                waterPercentage <= 100
                    ? waterPercentage
                    : null,
            waterLevelCm,
            waterDistanceCm,
        };
    }, [latest]);

    // ----------------------------------------
    // NORMALIZE HISTORICAL READINGS
    // ----------------------------------------
    const chartData = useMemo(() => {
        return history.map((reading, index) => {
            const percentage = toNumber(
                reading.water_percentage ?? reading.water_level
            );

            const ph = validPH(
                reading.ph_value ?? reading.ph
            );

            return {
                id: reading.id ?? `${reading.timestamp}-${index}`,
                time: formatTime(reading.timestamp),
                timestamp: reading.timestamp,
                waterPercentage:
                    percentage !== null &&
                    percentage >= 0 &&
                    percentage <= 100
                        ? percentage
                        : null,
                ph,
            };
        });
    }, [history]);

    const deviceOnline = deviceStatus === "online";

    const hasLatestReading = latest !== null;

    const waterStatus = getWaterStatus(values.waterPercentage);
    const phStatus = getPHStatus(values.ph);

    const cards = [
        {
            icon: "◌",
            title: "Water Level",
            value: values.waterPercentage === null
                ? "--"
                : values.waterPercentage.toFixed(1),
            unit: "%",
            status: waterStatus,
            description: "Measured reservoir capacity",
        },
        {
            icon: "✦",
            title: "pH Level",
            value: values.ph === null
                ? "--"
                : values.ph.toFixed(2),
            unit: "pH",
            status: phStatus,
            description: values.ph === null
                ? "Sensor reading unavailable"
                : "Reference range: 5.5–6.5",
        },
        {
            icon: "↕",
            title: "Water Height",
            value: values.waterLevelCm === null
                ? "--"
                : values.waterLevelCm.toFixed(1),
            unit: "cm",
            status: values.waterLevelCm === null
                ? "unavailable"
                : "normal",
            description: "Water height inside reservoir",
        },
        {
            icon: "⌁",
            title: "Sensor Distance",
            value: values.waterDistanceCm === null
                ? "--"
                : values.waterDistanceCm.toFixed(1),
            unit: "cm",
            status: values.waterDistanceCm === null
                ? "unavailable"
                : "normal",
            description: "Ultrasonic sensor to water surface",
        },
    ];

    return (
        <div className="dashboard-shell">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <main className="dashboard">
                <button
                    className="mobile-menu-button"
                    type="button"
                    onClick={() => setSidebarOpen((open) => !open)}
                    aria-label="Toggle navigation"
                    aria-expanded={sidebarOpen}
                >
                    ☰
                </button>

                {/* HEADER */}
                <header className="dashboard-header">
                    <div className="header-copy">
                        <span className="section-label">
                            HYDROCONTROL / MONITORING
                        </span>

                        <h1>Hydroponic Dashboard</h1>

                        <p>
                            Real-time reservoir measurements and ESP32
                            connectivity.
                        </p>
                    </div>

                    <div
                        className={`system-status ${
                            apiOffline ? "is-offline" : ""
                        }`}
                        role="status"
                    >
                        <span className="status-dot" />

                        <div>
                            <strong>
                                {apiOffline
                                    ? "API Offline"
                                    : "API Connected"}
                            </strong>

                            <small>
                                {apiOffline
                                    ? "Unable to retrieve dashboard data"
                                    : "Sensor API responding"}
                            </small>
                        </div>
                    </div>
                </header>

                {errorMessage && (
                    <div className="dashboard-error" role="alert">
                        {errorMessage}
                    </div>
                )}

                {/* DEVICE OVERVIEW */}
                <section className="dashboard-overview">
                    <div>
                        <span className="section-label">
                            DEVICE STATUS
                        </span>

                        <h2>ESP32 Hydroponic Controller</h2>

                        <p>
                            Device ID:{" "}
                            <strong>
                                {latest?.device_uid ||
                                    "ESP32-HYDRO-001"}
                            </strong>
                        </p>
                    </div>

                    <span
                        className={`sensor-status ${
                            deviceOnline ? "normal" : "warning"
                        }`}
                    >
                        <i />
                        {statusLabels[deviceStatus] || "Unknown"}
                    </span>
                </section>

                {/* SENSOR CARDS */}
                <section
                    className="sensor-grid"
                    aria-label="Current sensor measurements"
                >
                    {cards.map((card) => (
                        <MetricCard
                            key={card.title}
                            {...card}
                            value={
                                loading && !hasLatestReading
                                    ? "--"
                                    : card.value
                            }
                        />
                    ))}
                </section>

                {/* LIVE RESERVOIR */}
                <section className="system-3d-card">
                    <div className="system-3d-header">
                        <div>
                            <span className="section-label">
                                LIVE RESERVOIR
                            </span>

                            <h2>Water Level Overview</h2>

                            <p>
                                The reservoir indicator follows the
                                latest recorded water percentage.
                            </p>
                        </div>

                        <span className="live-badge">
                            <i />
                            {apiOffline ? "NO CONNECTION" : "LIVE"}
                        </span>
                    </div>

                    <div className="reservoir-panel">
                        <div className="reservoir-gauge">
                            <div
                                className="reservoir-gauge-fill"
                                style={{
                                    height: `${
                                        values.waterPercentage ?? 0
                                    }%`,
                                }}
                            />

                            <div className="reservoir-gauge-content">
                                <strong>
                                    {values.waterPercentage === null
                                        ? "--"
                                        : `${values.waterPercentage.toFixed(1)}%`}
                                </strong>

                                <span>Reservoir capacity</span>
                            </div>
                        </div>

                        <div className="reservoir-details">
                            <div>
                                <span>Water height</span>
                                <strong>
                                    {values.waterLevelCm === null
                                        ? "--"
                                        : `${values.waterLevelCm.toFixed(2)} cm`}
                                </strong>
                            </div>

                            <div>
                                <span>Sensor distance</span>
                                <strong>
                                    {values.waterDistanceCm === null
                                        ? "--"
                                        : `${values.waterDistanceCm.toFixed(2)} cm`}
                                </strong>
                            </div>

                            <div>
                                <span>Last measurement</span>
                                <strong>
                                    {formatDateTime(latest?.timestamp)}
                                </strong>
                            </div>

                            <div>
                                <span>Last ESP32 heartbeat</span>
                                <strong>
                                    {formatDateTime(deviceLastSeen)}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="system-stats">
                        <div>
                            <span>Water sensor</span>
                            <strong>
                                {values.waterPercentage === null
                                    ? "UNAVAILABLE"
                                    : "RECEIVING DATA"}
                            </strong>
                        </div>

                        <div>
                            <span>pH sensor</span>
                            <strong>
                                {values.ph === null
                                    ? "UNAVAILABLE"
                                    : "VALID READING"}
                            </strong>
                        </div>

                        <div>
                            <span>ESP32</span>
                            <strong>
                                {deviceStatus.toUpperCase()}
                            </strong>
                        </div>

                        <div>
                            <span>Refresh interval</span>
                            <strong>5 seconds</strong>
                        </div>
                    </div>
                </section>

                {/* WATER HISTORY */}
                <section className="charts-grid">
                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    WATER MONITORING
                                </span>

                                <h3>Water Level History</h3>
                            </div>

                            <span className="chart-period">
                                Latest 50 records
                            </span>
                        </div>

                        <div className="chart-wrap">
                            {chartData.length > 0 &&
                            chartData.some(
                                (item) => item.waterPercentage !== null
                            ) ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="waterFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#16c79a"
                                                    stopOpacity={0.4}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#16c79a"
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            opacity={0.15}
                                        />

                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            domain={[0, 100]}
                                            unit="%"
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            formatter={(value) =>
                                                value === null ||
                                                value === undefined
                                                    ? ["Unavailable", "Water level"]
                                                    : [`${value.toFixed(1)}%`, "Water level"]
                                            }
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="waterPercentage"
                                            name="Water level"
                                            stroke="#16c79a"
                                            strokeWidth={2.5}
                                            fill="url(#waterFill)"
                                            connectNulls={false}
                                            dot={false}
                                            activeDot={{ r: 5 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <ChartEmpty message="No valid water history available" />
                            )}
                        </div>
                    </article>

                    {/* PH HISTORY */}
                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    WATER QUALITY
                                </span>

                                <h3>pH History</h3>
                            </div>

                            <span className="chart-period">
                                Valid readings only
                            </span>
                        </div>

                        <div className="chart-wrap">
                            {chartData.length > 0 &&
                            chartData.some(
                                (item) => item.ph !== null
                            ) ? (
                                <ResponsiveContainer
                                    width="100%"
                                    height={300}
                                >
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: -15,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="phFill"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopColor="#a78bfa"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopColor="#a78bfa"
                                                    stopOpacity={0.02}
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            opacity={0.15}
                                        />

                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            domain={[0, 14]}
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            formatter={(value) =>
                                                value === null ||
                                                value === undefined
                                                    ? ["Unavailable", "pH"]
                                                    : [value.toFixed(2), "pH"]
                                            }
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="ph"
                                            name="pH"
                                            stroke="#a78bfa"
                                            strokeWidth={2.5}
                                            fill="url(#phFill)"
                                            connectNulls={false}
                                            dot={false}
                                            activeDot={{ r: 5 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <ChartEmpty message="No valid pH readings available" />
                            )}
                        </div>
                    </article>
                </section>

                {/* REAL COMPONENT STATUS */}
                <section className="bottom-grid">
                    <article className="quick-status-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    SYSTEM HEALTH
                                </span>

                                <h3>Component Status</h3>
                            </div>
                        </div>

                        <div className="component-list">
                            <div className="component-item">
                                <div className="component-icon">◌</div>

                                <div>
                                    <strong>Ultrasonic Sensor</strong>
                                    <span>
                                        {values.waterPercentage !== null
                                            ? "Water measurement available"
                                            : "No valid water measurement"}
                                    </span>
                                </div>

                                <b className={
                                    values.waterPercentage !== null
                                        ? "online"
                                        : "offline-label"
                                }>
                                    {values.waterPercentage !== null
                                        ? "DATA OK"
                                        : "NO DATA"}
                                </b>
                            </div>

                            <div className="component-item">
                                <div className="component-icon">◇</div>

                                <div>
                                    <strong>pH Sensor</strong>
                                    <span>
                                        {values.ph !== null
                                            ? "Valid pH measurement"
                                            : "Missing or invalid pH reading"}
                                    </span>
                                </div>

                                <b className={
                                    values.ph !== null
                                        ? "online"
                                        : "offline-label"
                                }>
                                    {values.ph !== null
                                        ? "VALID"
                                        : "UNAVAILABLE"}
                                </b>
                            </div>

                            <div className="component-item">
                                <div className="component-icon">⌁</div>

                                <div>
                                    <strong>ESP32 Controller</strong>
                                    <span>
                                        Last heartbeat:{" "}
                                        {formatDateTime(deviceLastSeen)}
                                    </span>
                                </div>

                                <b className={
                                    deviceOnline
                                        ? "online"
                                        : "offline-label"
                                }>
                                    {statusLabels[deviceStatus] || "Unknown"}
                                </b>
                            </div>

                            <div className="component-item">
                                <div className="component-icon">↻</div>

                                <div>
                                    <strong>Supabase Data</strong>
                                    <span>
                                        {latest
                                            ? "Latest database reading retrieved"
                                            : "No stored sensor reading"}
                                    </span>
                                </div>

                                <b className={
                                    !apiOffline
                                        ? "online"
                                        : "offline-label"
                                }>
                                    {apiOffline ? "ERROR" : "CONNECTED"}
                                </b>
                            </div>
                        </div>
                    </article>

                    <article className="quick-status-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    DATA SUMMARY
                                </span>

                                <h3>Latest Measurements</h3>
                            </div>
                        </div>

                        <div className="reservoir-details summary-details">
                            <div>
                                <span>Water level</span>
                                <strong>
                                    {values.waterPercentage === null
                                        ? "Unavailable"
                                        : `${values.waterPercentage.toFixed(1)}%`}
                                </strong>
                            </div>

                            <div>
                                <span>pH</span>
                                <strong>
                                    {values.ph === null
                                        ? "Unavailable"
                                        : values.ph.toFixed(2)}
                                </strong>
                            </div>

                            <div>
                                <span>Database timestamp</span>
                                <strong>
                                    {formatDateTime(latest?.timestamp)}
                                </strong>
                            </div>

                            <div>
                                <span>Dashboard sync</span>
                                <strong>
                                    {lastUpdated
                                        ? lastUpdated.toLocaleTimeString()
                                        : "Waiting for sync"}
                                </strong>
                            </div>
                        </div>
                    </article>
                </section>

                <footer className="dashboard-footer">
                    <span>HydroControl ESP32 System</span>

                    <span>
                        {lastUpdated
                            ? `Last sync ${lastUpdated.toLocaleTimeString()}`
                            : "Waiting for first sync"}
                    </span>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;
