import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Navbar";
import "../css/dashboard.css";

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

const API_URL = `${import.meta.env.VITE_API_URL}`;

const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const formatTime = (timestamp) => {
    if (!timestamp) return "--:--";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getStatus = (value, min, max) => {
    if (value === null) return "offline";
    return value >= min && value <= max ? "normal" : "warning";
};

function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [latest, setLatest] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [offline, setOffline] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);
const fetchSensorData = async () => {
    try {
        setLoading(true);

        const latestResponse = await fetch(
            `${API_URL}/sensors/latest`
        );

        const historyResponse = await fetch(
            `${API_URL}/sensors/history`
        );

        if (!latestResponse.ok) {
            throw new Error(
                `Latest sensor request failed: ${latestResponse.status}`
            );
        }

        if (!historyResponse.ok) {
            throw new Error(
                `Sensor history request failed: ${historyResponse.status}`
            );
        }

        const latestData = await latestResponse.json();
        const historyData = await historyResponse.json();

        // ==========================================
        // UPDATE REACT STATE
        // ==========================================

        if (latestData.success && latestData.data) {
            setLatest(latestData.data);
        } else {
            throw new Error(
                latestData.message || "Invalid latest sensor data"
            );
        }

        if (historyData.success && Array.isArray(historyData.data)) {
            setHistory(historyData.data);
        } else {
            throw new Error(
                historyData.message || "Invalid sensor history data"
            );
        }

        // API is working
        setOffline(false);

        // Update sync time
        setLastUpdated(new Date());

    } catch (error) {
        console.error("Dashboard sensor error:", error);

        setOffline(true);

    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        fetchSensorData();
        const interval = setInterval(fetchSensorData, 5000);
        return () => clearInterval(interval);
    }, []);

    const values = useMemo(() => ({
        temperature: toNumber(latest?.temperature),
        ph: toNumber(latest?.ph_value),
        waterLevel: toNumber(latest?.water_level),
        nutrientA: toNumber(latest?.nutrient_a),
        nutrientB: toNumber(latest?.nutrient_b)
    }), [latest]);

    const waterData = useMemo(
        () => history.map((reading) => ({
            time: formatTime(reading.timestamp),
            temperature: toNumber(reading.temperature),
            ph: toNumber(reading.ph_value)
        })),
        [history]
    );

    const nutrientData = useMemo(
        () => history.map((reading) => ({
            time: formatTime(reading.timestamp),
            nutrientA: toNumber(reading.nutrient_a),
            nutrientB: toNumber(reading.nutrient_b)
        })),
        [history]
    );

    const pumpData = useMemo(() => [
        { name: "Water", runtime: 82 },
        { name: "Nutrient A", runtime: 64 },
        { name: "Nutrient B", runtime: 48 },
        { name: "Circulation", runtime: 71 }
    ], []);

    const nutrientAverage = values.nutrientA !== null && values.nutrientB !== null
        ? ((values.nutrientA + values.nutrientB) / 2).toFixed(0)
        : "--";

    const cards = [
        {
            icon: "◉",
            title: "Water Temperature",
            value: values.temperature?.toFixed(1) ?? "--",
            unit: "°C",
            status: getStatus(values.temperature, 22, 26),
            description: "Target range 22–26°C"
        },
        {
            icon: "⌁",
            title: "pH Level",
            value: values.ph?.toFixed(2) ?? "--",
            unit: "pH",
            status: getStatus(values.ph, 5.8, 6.5),
            description: "Target range 5.8–6.5"
        },
        {
            icon: "◌",
            title: "Water Level",
            value: values.waterLevel?.toFixed(0) ?? "--",
            unit: "%",
            status: getStatus(values.waterLevel, 30, 100),
            description: "Reservoir capacity"
        },
        {
            icon: "✦",
            title: "Nutrient Average",
            value: nutrientAverage,
            unit: "%",
            status: nutrientAverage === "--" ? "offline" : getStatus(Number(nutrientAverage), 40, 100),
            description: "Nutrient A + B average"
        }
    ];

    const statusText = {
        normal: "Normal",
        warning: "Warning",
        offline: "Offline"
    };

    const renderChartEmpty = (message) => (
        <div className="chart-empty">
            <span>⌁</span>
            <p>{message}</p>
            <small>Waiting for sensor readings</small>
        </div>
    );

    return (
        <div className="dashboard-shell">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

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
                    </div>

                    <div className={`system-status ${offline ? "is-offline" : ""}`}>
                        <span className="status-dot" />
                        <div>
                            <strong>{offline ? "Connection Offline" : "System Online"}</strong>
                            <small>{offline ? "API unavailable" : "All monitored systems operational"}</small>
                        </div>
                    </div>
                </header>

                <section className="sensor-grid">
                    {cards.map((card) => (
                        <article className="sensor-card" key={card.title}>
                            <div className="sensor-card-glow" />
                            <div className="sensor-card-top">
                                <div className="sensor-icon">{card.icon}</div>
                                <span className={`sensor-status ${card.status}`}>
                                    <i /> {statusText[card.status]}
                                </span>
                            </div>
                            <span className="sensor-title">{card.title}</span>
                            <div className="sensor-value">
                                {loading && !latest ? "--" : card.value}
                                <span>{card.unit}</span>
                            </div>
                            <p className="sensor-description">{card.description}</p>
                        </article>
                    ))}
                </section>

                <section className="system-3d-card">
                    <div className="system-3d-header">
                        <div>
                            <span className="section-label">LIVE SYSTEM MODEL</span>
                            <h2>3D Hydroponic Overview</h2>
                            <p>Reservoir and grow-channel status at a glance.</p>
                        </div>
                        <span className="live-badge"><i /> LIVE</span>
                    </div>

                    <div className="hydroponic-visual">
                        <div className="grid-floor" />
                        <div className="tank-shadow" />

                        <div className="water-tank">
                            <div className="tank-lid">RESERVOIR</div>
                            <div className="tank-glass">
                                <div
                                    className="water-level"
                                    style={{ height: `${Math.min(Math.max(values.waterLevel ?? 0, 0), 100)}%` }}
                                >
                                    <div className="water-wave wave-one" />
                                    <div className="water-wave wave-two" />
                                    <strong>{values.waterLevel !== null ? `${values.waterLevel.toFixed(0)}%` : "--"}</strong>
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
                            <small>ACTIVE</small>
                        </div>
                    </div>

                    <div className="system-stats">
                        <div><span>Pumps</span><strong>4 / 4</strong></div>
                        <div><span>Sensors</span><strong>{latest ? "5 / 5" : "--"}</strong></div>
                        <div><span>Automation</span><strong>ON</strong></div>
                        <div><span>Refresh</span><strong>5 sec</strong></div>
                    </div>
                </section>

                <section className="charts-grid">
                    <article className="chart-card chart-card-large">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">WATER MONITORING</span>
                                <h3>Temperature & pH</h3>
                            </div>
                            <span className="chart-period">Latest {history.length || 0} readings</span>
                        </div>
                        <div className="chart-wrap">
                            {waterData.length ? (
                                <ResponsiveContainer width="100%" height={310}>
                                    <LineChart data={waterData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
                                        <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="temp" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="ph" orientation="right" domain={[5, 7]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(9,22,18,.96)" }} />
                                        <Legend />
                                        <Line yAxisId="temp" type="monotone" dataKey="temperature" name="Temperature °C" strokeWidth={3} dot={false} connectNulls />
                                        <Line yAxisId="ph" type="monotone" dataKey="ph" name="pH" strokeWidth={3} dot={false} connectNulls />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : renderChartEmpty("No water history available")}
                        </div>
                    </article>

                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">NUTRIENT CONTROL</span>
                                <h3>Nutrient Levels</h3>
                            </div>
                            <span className="chart-period">Live history</span>
                        </div>
                        <div className="chart-wrap">
                            {nutrientData.length ? (
                                <ResponsiveContainer width="100%" height={310}>
                                    <AreaChart data={nutrientData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="nutrientA" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={0.35} /><stop offset="100%" stopOpacity={0} /></linearGradient>
                                            <linearGradient id="nutrientB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopOpacity={0.25} /><stop offset="100%" stopOpacity={0} /></linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
                                        <XAxis dataKey="time" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(9,22,18,.96)" }} />
                                        <Legend />
                                        <Area type="monotone" dataKey="nutrientA" name="Nutrient A" strokeWidth={2.5} fill="url(#nutrientA)" connectNulls />
                                        <Area type="monotone" dataKey="nutrientB" name="Nutrient B" strokeWidth={2.5} fill="url(#nutrientB)" connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : renderChartEmpty("No nutrient history available")}
                        </div>
                    </article>
                </section>

                <section className="bottom-grid">
                    <article className="chart-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">AUTOMATION</span>
                                <h3>Pump Runtime</h3>
                            </div>
                            <span className="chart-period">Current cycle</span>
                        </div>
                        <div className="chart-wrap">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={pumpData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(9,22,18,.96)" }} />
                                    <Bar dataKey="runtime" name="Runtime %" radius={[8, 8, 2, 2]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </article>

                    <article className="quick-status-card">
                        <div className="chart-header">
                            <div>
                                <span className="section-label">CONTROL CENTER</span>
                                <h3>System Components</h3>
                            </div>
                        </div>
                        <div className="component-list">
                            <div className="component-item"><div className="component-icon">◌</div><div><strong>Water Pump</strong><span>Circulation system</span></div><b className="online">ON</b></div>
                            <div className="component-item"><div className="component-icon">✦</div><div><strong>Nutrient Pumps</strong><span>Automatic dosing</span></div><b className="online">AUTO</b></div>
                            <div className="component-item"><div className="component-icon">⌁</div><div><strong>pH Controller</strong><span>{values.ph !== null ? `Stable at ${values.ph.toFixed(2)}` : "Waiting for sensor"}</span></div><b className={values.ph !== null ? "online" : "offline-label"}>{values.ph !== null ? "OK" : "N/A"}</b></div>
                            <div className="component-item"><div className="component-icon">◇</div><div><strong>ESP32 Controller</strong><span>{offline ? "Connection unavailable" : "API connection active"}</span></div><b className={offline ? "offline-label" : "online"}>{offline ? "OFFLINE" : "ONLINE"}</b></div>
                        </div>
                    </article>
                </section>

                <footer className="dashboard-footer">
                    <span>HydroControl ESP32 System</span>
                    <span>{lastUpdated ? `Last synced ${lastUpdated.toLocaleTimeString()}` : "Waiting for first sync"}</span>
                </footer>
            </main>
        </div>
    );
}

export default Dashboard;
