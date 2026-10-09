
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Navbar";
import "../css/dashboard.css";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
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
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
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

const getStatus = (value, min, max) => {
    if (value === null) return "offline";
    return value >= min && value <= max ? "normal" : "warning";
};

async function fetchJson(path) {
    const response = await fetch(`${API_URL}${path}`);
    let body;

    try {
        body = await response.json();
    } catch {
        throw new Error(`Invalid server response (${response.status})`);
    }

    if (!response.ok || body?.success === false) {
        throw new Error(body?.message || `Request failed (${response.status})`);
    }

    return body;
}

function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apiOffline, setApiOffline] = useState(false);
    const [deviceStatus, setDeviceStatus] = useState("unknown");
    const [deviceLastSeen, setDeviceLastSeen] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const fetchSensorData = useCallback(async () => {
        try {
            const [latestResult, historyResult] = await Promise.all([
                fetchJson("/api/sensors/latest"),
                fetchJson("/api/sensors/history"),
            ]);

            if (!latestResult.data) {
                throw new Error("No latest sensor reading returned");
            }

            if (!Array.isArray(historyResult.data)) {
                throw new Error("Sensor history response is not an array");
            }

            setLatest(latestResult.data);
            setHistory(historyResult.data);
            setApiOffline(false);
            setErrorMessage("");
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Dashboard sensor error:", error);
            setApiOffline(true);
            setErrorMessage(error.message || "Unable to connect to the API");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDeviceStatus = useCallback(async () => {
        try {
            const result = await fetchJson("/api/sensors/device-status");

            // Supports either { data: { status, last_seen } }
            // or { device: { status, last_seen } } API responses.
            const device = result.data || result.device || {};

            setDeviceStatus(
                device.status || (result.online ? "online" : "unknown")
            );
            setDeviceLastSeen(device.last_seen || null);
        } catch (error) {
            console.error("Device status error:", error);
            setDeviceStatus("unknown");
        }
    }, []);

    useEffect(() => {
        let active = true;

        const refresh = async () => {
            if (!active) return;

            await Promise.all([
                fetchSensorData(),
                fetchDeviceStatus(),
            ]);
        };

        refresh();

        const interval = window.setInterval(refresh, REFRESH_MS);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [fetchSensorData, fetchDeviceStatus]);

    const values = useMemo(() => ({
        waterLevel: toNumber(latest?.water_level),
        nutrientA: toNumber(latest?.nutrient_a),
        nutrientB: toNumber(latest?.nutrient_b),
    }), [latest]);

    const nutrientData = useMemo(
        () =>
            history.map((reading) => ({
                time: formatTime(reading.timestamp),
                nutrientA: toNumber(reading.nutrient_a),
                nutrientB: toNumber(reading.nutrient_b),
            })),
        [history]
    );

    // Demonstration values only; these are not actual pump telemetry.
    const pumpData = useMemo(() => [
        { name: "Water", runtime: 82 },
        { name: "Nutrient A", runtime: 64 },
        { name: "Nutrient B", runtime: 48 },
        { name: "Circulation", runtime: 71 },
    ], []);

    const nutrientAverage =
        values.nutrientA !== null && values.nutrientB !== null
            ? ((values.nutrientA + values.nutrientB) / 2).toFixed(0)
            : "--";

    const cards = [
        {
            icon: "◌",
            title: "Water Level",
            value: values.waterLevel?.toFixed(0) ?? "--",
            unit: "%",
            status: getStatus(values.waterLevel, 30, 100),
            description: "Reservoir capacity",
        },
        {
            icon: "✦",
            title: "Nutrient Average",
            value: nutrientAverage,
            unit: "%",
            status:
                nutrientAverage === "--"
                    ? "offline"
                    : getStatus(Number(nutrientAverage), 40, 100),
            description: "Nutrient A + B average",
        },
    ];

    const statusText = {
        normal: "Normal",
        warning: "Warning",
        offline: "Unavailable",
    };

    const renderChartEmpty = (message) => (
        <div className="chart-empty">
            <span>⌁</span>
            <p>{message}</p>
            <small>Waiting for sensor readings</small>
        </div>
    );

    const deviceOnline = deviceStatus === "online";

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
                >
                    ☰
                </button>

                <header className="dashboard-header">
                    <div className="header-copy">
                        <h1>Hydroponic Environment</h1>
                        <p>Live sensor readings and device connectivity</p>
                    </div>

                    <div
                        className={`system-status ${
                            apiOffline ? "is-offline" : ""
                        }`}
                    >
                        <span className="status-dot" />
                        <div>
                            <strong>
                                {apiOffline ? "API Offline" : "API Online"}
                            </strong>
                            <small>
                                {apiOffline
                                    ? "Cannot load sensor data"
                                    : "Backend is responding"}
                            </small>
                        </div>
                    </div>
                </header>

                {errorMessage && (
                    <div className="dashboard-error" role="alert">
                        {errorMessage}
                    </div>
                )}

                <section className="sensor-grid">
                    {cards.map((card) => (
                        <article className="sensor-card" key={card.title}>
                            <div className="sensor-card-glow" />

                            <div className="sensor-card-top">
                                <div className="sensor-icon">
                                    {card.icon}
                                </div>

                                <span className={`sensor-status ${card.status}`}>
                                    <i />
                                    {statusText[card.status]}
                                </span>
                            </div>

                            <span className="sensor-title">
                                {card.title}
                            </span>

                            <div className="sensor-value">
                                {loading && !latest ? "--" : card.value}
                                <span>{card.unit}</span>
                            </div>

                            <p className="sensor-description">
                                {card.description}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="system-3d-card">
                    <div className="system-3d-header">
                        <div>
                            <span className="section-label">
                                LIVE SYSTEM MODEL
                            </span>
                            <h2>3D Hydroponic Overview</h2>
                            <p>
                                Reservoir and grow-channel status at a glance.
                            </p>
                        </div>

                        <span className="live-badge">
                            <i /> LIVE
                        </span>
                    </div>

                    <div className="hydroponic-visual">
                        <div className="grid-floor" />
                        <div className="tank-shadow" />

                        <div className="water-tank">
                            <div className="tank-lid">RESERVOIR</div>

                            <div className="tank-glass">
                                <div
                                    className="water-level"
                                    style={{
                                        height: `${
                                            Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    values.waterLevel ?? 0
                                                )
                                            )
                                        }%`,
                                    }}
                                >
                                    <div className="water-wave wave-one" />
                                    <div className="water-wave wave-two" />

                                    <strong>
                                        {values.waterLevel !== null
                                            ? `${values.waterLevel.toFixed(0)}%`
                                            : "--"}
                                    </strong>
                                </div>

                                <span className="tank-measure top">100%</span>
                                <span className="tank-measure mid">50%</span>
                                <span className="tank-measure bottom">0%</span>
                            </div>
                        </div>

                        <div className="grow-rack">
                            {["A", "B", "C"].map((row) => (
                                <div className="grow-row" key={row}>
                                    <span className="plant plant-a">🌿</span>
                                    <span className="plant plant-b">🌱</span>
                                    <span className="plant plant-c">🌿</span>
                                    <span className="grow-channel" />
                                    <b>{row}</b>
                                </div>
                            ))}
                        </div>

                        <div className="pipe pipe-one" />
                        <div className="pipe pipe-two" />
                        <div className="pipe pipe-three" />

                        <div className="pump-unit">
                            <span className="pump-light" />
                            <strong>PUMP</strong>
                            <small>
                                {deviceOnline
                                    ? "DEVICE ONLINE"
                                    : "CHECK DEVICE"}
                            </small>
                        </div>
                    </div>

                    <div className="system-stats">
                        <div>
                            <span>Pumps</span>
                            <strong>3</strong>
                        </div>
                        <div>
                            <span>Sensors</span>
                            <strong>{latest ? "3 / 3" : "--"}</strong>
                        </div>
                        <div>
                            <span>ESP32</span>
                            <strong>
                                {deviceOnline
                                    ? "ONLINE"
                                    : deviceStatus.toUpperCase()}
                            </strong>
                        </div>
                        <div>
                            <span>Refresh</span>
                            <strong>5 sec</strong>
                        </div>
                    </div>
                </section>

                <section className="charts-grid">
                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    NUTRIENT CONTROL
                                </span>
                                <h3>Nutrient Levels</h3>
                            </div>
                            <span className="chart-period">Live history</span>
                        </div>

                        <div className="chart-wrap">
                            {nutrientData.length ? (
                                <ResponsiveContainer width="100%" height={310}>
                                    <AreaChart
                                        data={nutrientData}
                                        margin={{
                                            top: 10,
                                            right: 8,
                                            left: -18,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="nutrientA"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopOpacity={0.35}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>

                                            <linearGradient
                                                id="nutrientB"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="0%"
                                                    stopOpacity={0.25}
                                                />
                                                <stop
                                                    offset="100%"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            opacity={0.12}
                                        />

                                        <XAxis
                                            dataKey="time"
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tick={{ fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                border: "1px solid rgba(255,255,255,.12)",
                                                background: "rgba(9,22,18,.96)",
                                            }}
                                        />

                                        <Legend />

                                        <Area
                                            type="monotone"
                                            dataKey="nutrientA"
                                            name="Nutrient A"
                                            strokeWidth={2.5}
                                            fill="url(#nutrientA)"
                                            connectNulls
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="nutrientB"
                                            name="Nutrient B"
                                            strokeWidth={2.5}
                                            fill="url(#nutrientB)"
                                            connectNulls
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                renderChartEmpty(
                                    "No nutrient history available"
                                )
                            )}
                        </div>
                    </article>
                </section>

                <section className="bottom-grid">
                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    AUTOMATION
                                </span>
                                <h3>Pump Runtime</h3>
                            </div>
                            <span className="chart-period">
                                Illustrative values
                            </span>
                        </div>

                        <div className="chart-wrap">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={pumpData}
                                    margin={{
                                        top: 10,
                                        right: 8,
                                        left: -18,
                                        bottom: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        opacity={0.12}
                                    />

                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        domain={[0, 100]}
                                        tick={{ fontSize: 11 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: 12,
                                            border: "1px solid rgba(255,255,255,.12)",
                                            background: "rgba(9,22,18,.96)",
                                        }}
                                    />

                                    <Bar
                                        dataKey="runtime"
                                        name="Runtime %"
                                        radius={[8, 8, 2, 2]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="quick-status-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">
                                    CONTROL CENTER
                                </span>
                                <h3>System Components</h3>
                            </div>
                        </div>

                        <div className="component-list">
                            <div className="component-item">
                                <div className="component-icon">◌</div>
                                <div>
                                    <strong>Water Pump</strong>
                                    <span>Circulation system</span>
                                </div>
                                <b className={
                                    deviceOnline ? "online" : "offline-label"
                                }>
                                    {deviceOnline ? "DEVICE ONLINE" : "CHECK"}
                                </b>
                            </div>

                            <div className="component-item">
                                <div className="component-icon">✦</div>
                                <div>
                                    <strong>Nutrient Pumps</strong>
                                    <span>Automatic dosing</span>
                                </div>
                                <b className="online">AUTO</b>
                            </div>

                            <div className="component-item">
                                <div className="component-icon">◇</div>
                                <div>
                                    <strong>ESP32 Controller</strong>
                                    <span>
                                        {deviceStatus === "unknown"
                                            ? "Device status unavailable"
                                            : deviceOnline
                                                ? "Last heartbeat received"
                                                : "No recent heartbeat"}
                                    </span>
                                </div>
                                <b className={
                                    deviceOnline ? "online" : "offline-label"
                                }>
                                    {deviceStatus.toUpperCase()}
                                </b>
                            </div>
                        </div>

                        <p className="device-last-seen">
                            Last ESP32 heartbeat:{" "}
                            {deviceLastSeen
                                ? new Date(deviceLastSeen).toLocaleString()
                                : "Not available"}
                        </p>
                    </article>
                </section>

                <footer className="dashboard-footer">
                    <span>HydroControl ESP32 System</span>
                    <span>
                        {lastUpdated
                            ? `Last API sync ${lastUpdated.toLocaleTimeString()}`
                            : "Waiting for first sync"}
                    </span>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;
